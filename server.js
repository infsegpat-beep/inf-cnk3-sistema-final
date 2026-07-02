const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'inf-cnk3-jwt-secret-2024-change-in-production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Arquivos estáticos
app.use(express.static('public'));

// Configuração do multer para upload organizado
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'geral';
    const uploadPath = `public/uploads/${category}`;
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas!'));
  }
});

// Dados iniciais
const defaultData = {
  empresa: {
    nome: 'INF – CNK3 Soluções Técnicas',
    descricao: 'A INF – CNK3 Soluções Técnicas atua na execução de serviços especializados de manutenção predial, instalações elétricas, serviços hidráulicos e automação residencial e comercial, oferecendo soluções completas para residências, condomínios, empresas e órgãos públicos no Rio de Janeiro.',
    descricao2: 'Nossa prioridade é entregar serviços seguros, organizados e executados conforme boas práticas técnicas, utilizando materiais de qualidade e atendimento transparente. Atendemos Vargem Pequena, Vargem Grande, Recreio, Barra da Tijuca e toda a Zona Oeste do Rio de Janeiro.',
    anosExperiencia: '10+',
    cnpj: '40.606.310/0001-79'
  },
  contato: {
    telefone: '(21) 99455-1228',
    whatsapp: '5521994551228',
    email: 'infcnk3@gmail.com',
    endereco: 'Rua Professor Silvio Elia, 46 – Vargem Pequena, Rio de Janeiro'
  },
  servicos: [
    {
      categoria: 'eletrica',
      titulo: 'Instalações Elétricas',
      itens: ['Iluminação LED', 'Quadros Elétricos', 'Disjuntores', 'Tomadas', 'Interruptores', 'Diagnóstico de Falhas', 'Sensores', 'Refletores', 'Manutenção Preventiva']
    },
    {
      categoria: 'hidraulica',
      titulo: 'Hidráulica',
      itens: ['Vazamentos', 'Torneiras', 'Registros', 'Bombas', 'Caixa Acoplada', 'Duchas', 'Tubulações', 'Cisternas', 'Caixas d\'Água']
    },
    {
      categoria: 'manutencao',
      titulo: 'Manutenção Predial',
      itens: ['Drywall', 'Pintura', 'Gesso', 'Calhas', 'Impermeabilização', 'Pequenas Reformas', 'Reparos', 'Alvenaria', 'Carpintaria']
    },
    {
      categoria: 'automacao',
      titulo: 'Automação',
      itens: ['Fechaduras e Portões Automáticos', 'Controle de Iluminação Inteligente', 'Câmeras e Sistemas de Segurança', 'Automação via Aplicativo', 'Eficiência e Economia de Energia', 'Instalação', 'Manutenção', 'Suporte Técnico']
    }
  ],
  portfolio: [
    {
      titulo: 'Organização de Quadro Elétrico',
      descricao: 'Substituição e organização completa de quadro de distribuição com disjuntores, contatoras e relés.',
      categoria: 'Elétrica',
      antes: 'fotos/quadro-desorganizado.jpg',
      depois: 'fotos/quadro-eletrico.jpg'
    }
  ],
  depoimentos: [
    {
      nome: 'Maria Clara',
      local: 'Residencial – Barra da Tijuca',
      texto: 'Excelente atendimento. Profissionais pontuais e organizados. Resolveram o problema elétrico da minha casa com rapidez e segurança.',
      estrelas: 5
    }
  ],
  orcamentos: [],
  admin: {
    usuario: 'admin',
    senha: bcrypt.hashSync('inf123', 10),
    primeiroAcesso: true
  }
};

// Carregar ou criar dados
let data;
const dataPath = './data/content.json';

if (fs.existsSync(dataPath)) {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} else {
  data = defaultData;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Middleware de autenticação
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Não autorizado' });
}

// ROTAS PÚBLICAS

app.get('/api/content', (req, res) => {
  const publicData = { ...data };
  delete publicData.admin;
  delete publicData.orcamentos;
  res.json(publicData);
});

// ROTAS DE AUTENTICAÇÃO

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  
  if (usuario === data.admin.usuario && bcrypt.compareSync(senha, data.admin.senha)) {
    req.session.authenticated = true;
    req.session.usuario = usuario;
    
    const token = jwt.sign(
      { usuario, admin: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token,
      primeiroAcesso: data.admin.primeiroAcesso 
    });
  } else {
    res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }
});

app.post('/api/change-password', requireAuth, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  
  if (!bcrypt.compareSync(senhaAtual, data.admin.senha)) {
    return res.status(400).json({ error: 'Senha atual incorreta' });
  }
  
  data.admin.senha = bcrypt.hashSync(novaSenha, 10);
  data.admin.primeiroAcesso = false;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  res.json({ success: true, message: 'Senha alterada com sucesso' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ 
    authenticated: !!(req.session && req.session.authenticated),
    primeiroAcesso: data.admin.primeiroAcesso
  });
});

// ROTAS ADMINISTRATIVAS

app.post('/api/admin/empresa', requireAuth, (req, res) => {
  data.empresa = req.body;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.post('/api/admin/contato', requireAuth, (req, res) => {
  data.contato = req.body;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.get('/api/admin/servicos', requireAuth, (req, res) => {
  res.json(data.servicos);
});

app.post('/api/admin/servicos', requireAuth, (req, res) => {
  data.servicos = req.body;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.get('/api/admin/portfolio', requireAuth, (req, res) => {
  res.json(data.portfolio);
});

app.post('/api/admin/portfolio', requireAuth, (req, res) => {
  data.portfolio = req.body;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.get('/api/admin/depoimentos', requireAuth, (req, res) => {
  res.json(data.depoimentos);
});

app.post('/api/admin/depoimentos', requireAuth, (req, res) => {
  data.depoimentos = req.body;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// ORÇAMENTOS
app.get('/api/admin/orcamentos', requireAuth, (req, res) => {
  res.json(data.orcamentos || []);
});

app.post('/api/admin/orcamentos', requireAuth, (req, res) => {
  const orcamento = {
    id: Date.now(),
    ...req.body,
    data: new Date().toISOString(),
    status: 'pendente'
  };
  
  if (!data.orcamentos) data.orcamentos = [];
  data.orcamentos.push(orcamento);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  res.json({ success: true, orcamento });
});

app.put('/api/admin/orcamentos/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.orcamentos.findIndex(o => o.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Orçamento não encontrado' });
  }
  
  data.orcamentos[index] = { ...data.orcamentos[index], ...req.body };
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  res.json({ success: true });
});

app.delete('/api/admin/orcamentos/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  data.orcamentos = data.orcamentos.filter(o => o.id !== id);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// GERAR PDF DO ORÇAMENTO
app.get('/api/orcamento/:id/pdf', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const orcamento = data.orcamentos.find(o => o.id === id);
  
  if (!orcamento) {
    return res.status(404).json({ error: 'Orçamento não encontrado' });
  }
  
  const doc = new PDFDocument();
  const filename = `orcamento-${orcamento.id}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  
  // Cabeçalho
  doc.fontSize(24).fillColor('#0B3C5D').text(data.empresa.nome, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).fillColor('#666').text('Soluções Técnicas', { align: 'center' });
  doc.moveDown(2);
  
  // Informações do orçamento
  doc.fontSize(16).fillColor('#0B3C5D').text('ORÇAMENTO', { underline: true });
  doc.moveDown();
  doc.fontSize(11).fillColor('#333');
  doc.text(`Número: ${orcamento.id}`);
  doc.text(`Data: ${new Date(orcamento.data).toLocaleDateString('pt-BR')}`);
  doc.text(`Cliente: ${orcamento.cliente}`);
  doc.text(`Telefone: ${orcamento.telefone || 'N/A'}`);
  doc.text(`Endereço: ${orcamento.endereco || 'N/A'}`);
  doc.moveDown();
  
  // Serviços
  doc.fontSize(14).fillColor('#0B3C5D').text('SERVIÇOS', { underline: true });
  doc.moveDown();
  doc.fontSize(11).fillColor('#333');
  
  if (orcamento.servicos && orcamento.servicos.length > 0) {
    orcamento.servicos.forEach((serv, i) => {
      doc.text(`${i + 1}. ${serv.descricao}`);
      if (serv.valor) {
        doc.text(`   Valor: R$ ${serv.valor.toFixed(2)}`);
      }
    });
  }
  doc.moveDown();
  
  // Materiais
  if (orcamento.materiais && orcamento.materiais.length > 0) {
    doc.fontSize(14).fillColor('#0B3C5D').text('MATERIAIS', { underline: true });
    doc.moveDown();
    doc.fontSize(11).fillColor('#333');
    
    orcamento.materiais.forEach((mat, i) => {
      doc.text(`${i + 1}. ${mat.descricao}`);
      if (mat.valor) {
        doc.text(`   Valor: R$ ${mat.valor.toFixed(2)}`);
      }
    });
    doc.moveDown();
  }
  
  // Mão de obra
  if (orcamento.maoDeObra && orcamento.maoDeObra > 0) {
    doc.fontSize(14).fillColor('#0B3C5D').text('MÃO DE OBRA', { underline: true });
    doc.moveDown();
    doc.fontSize(11).fillColor('#333');
    doc.text(`Valor: R$ ${orcamento.maoDeObra.toFixed(2)}`);
    doc.moveDown();
  }
  
  // Total
  const total = (orcamento.totalServicos || 0) + (orcamento.totalMateriais || 0) + (orcamento.maoDeObra || 0);
  
  doc.fontSize(14).fillColor('#0B3C5D').text('TOTAL', { underline: true });
  doc.moveDown();
  doc.fontSize(16).fillColor('#F28C28').text(`R$ ${total.toFixed(2)}`, { align: 'right' });
  doc.moveDown(2);
  
  // Observações
  if (orcamento.observacoes) {
    doc.fontSize(12).fillColor('#0B3C5D').text('OBSERVAÇÕES', { underline: true });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(orcamento.observacoes);
    doc.moveDown();
  }
  
  // Rodapé
  doc.fontSize(10).fillColor('#999');
  doc.text('INF – CNK3 Soluções Técnicas', { align: 'center' });
  doc.text('CNPJ: ' + data.empresa.cnpj, { align: 'center' });
  doc.text('Telefone: ' + data.contato.telefone, { align: 'center' });
  doc.text('E-mail: ' + data.contato.email, { align: 'center' });
  
  doc.end();
});

// UPLOAD DE IMAGEM
app.post('/api/admin/upload', requireAuth, upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  }
  
  const category = req.body.category || 'geral';
  const url = `/uploads/${category}/${req.file.filename}`;
  
  res.json({
    success: true,
    url: url,
    filename: req.file.filename,
    category: category
  });
});

// LISTAR IMAGENS
app.get('/api/admin/images', requireAuth, (req, res) => {
  const uploadsDir = path.join(__dirname, 'public/uploads');
  const fotosDir = path.join(__dirname, 'public/fotos');
  
  let images = [];
  
  // Imagens de uploads organizadas por categoria
  if (fs.existsSync(uploadsDir)) {
    const categories = fs.readdirSync(uploadsDir);
    categories.forEach(cat => {
      const catPath = path.join(uploadsDir, cat);
      if (fs.statSync(catPath).isDirectory()) {
        const files = fs.readdirSync(catPath);
        files.forEach(file => {
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            images.push({
              url: `/uploads/${cat}/${file}`,
              category: cat,
              filename: file
            });
          }
        });
      }
    });
  }
  
  // Imagens da pasta fotos
  if (fs.existsSync(fotosDir)) {
    const files = fs.readdirSync(fotosDir);
    files.forEach(file => {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
        images.push({
          url: `/fotos/${file}`,
          category: 'fotos',
          filename: file
        });
      }
    });
  }
  
  res.json(images);
});

// EXPORTAR/IMPORTAR
app.get('/api/admin/export', requireAuth, (req, res) => {
  const exportData = { ...data };
  delete exportData.admin;
  res.setHeader('Content-Disposition', 'attachment; filename=inf-cnk3-backup.json');
  res.json(exportData);
});

app.post('/api/admin/import', requireAuth, (req, res) => {
  try {
    const importData = req.body;
    Object.keys(importData).forEach(key => {
      if (key !== 'admin') {
        data[key] = importData[key];
      }
    });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao importar dados' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor INF-CNK3 rodando na porta ${PORT}`);
  console.log(`\n📍 Acessos:`);
  console.log(`   Site público: http://localhost:${PORT}`);
  console.log(`   Painel admin: http://localhost:${PORT}/login.html`);
  console.log(`\n🔐 Credenciais padrão:`);
  console.log(`   Usuário: admin`);
  console.log(`   Senha: inf123`);
  console.log(`\n⚠️  IMPORTANTE: Altere a senha no primeiro acesso!\n`);
});
