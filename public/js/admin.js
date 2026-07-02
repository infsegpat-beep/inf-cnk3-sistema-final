// Verificar autenticação
async function checkAuth() {
  const res = await fetch('/api/check-auth');
  const data = await res.json();
  if (!data.authenticated) {
    window.location.href = '/login.html';
  }
}

checkAuth();

// Dados globais
let siteData = {};
let currentImages = [];

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Navegação
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + section).classList.add('active');
    
    document.getElementById('pageTitle').textContent = item.textContent.trim();
    
    // Load data for section
    if (section === 'imagens') loadImages();
  });
});

// Menu mobile
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Logout
document.getElementById('btnLogout').addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

// Carregar dados iniciais
async function loadData() {
  const res = await fetch('/api/content');
  siteData = await res.json();
  
  // Dashboard stats
  document.getElementById('statServicos').textContent = siteData.servicos.length;
  document.getElementById('statPortfolio').textContent = siteData.portfolio.length;
  document.getElementById('statDepoimentos').textContent = siteData.depoimentos.length;
  
  // Empresa form
  document.getElementById('empNome').value = siteData.empresa.nome;
  document.getElementById('empAnos').value = siteData.empresa.anosExperiencia;
  document.getElementById('empCnpj').value = siteData.empresa.cnpj;
  document.getElementById('empDescricao').value = siteData.empresa.descricao;
  document.getElementById('empDescricao2').value = siteData.empresa.descricao2;
  
  // Contato form
  document.getElementById('contTelefone').value = siteData.contato.telefone;
  document.getElementById('contWhatsapp').value = siteData.contato.whatsapp;
  document.getElementById('contEmail').value = siteData.contato.email;
  document.getElementById('contEndereco').value = siteData.contato.endereco;
  
  // Render lists
  renderServicos();
  renderPortfolio();
  renderDepoimentos();
}

// Salvar Empresa
document.getElementById('formEmpresa').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    nome: document.getElementById('empNome').value,
    anosExperiencia: document.getElementById('empAnos').value,
    cnpj: document.getElementById('empCnpj').value,
    descricao: document.getElementById('empDescricao').value,
    descricao2: document.getElementById('empDescricao2').value
  };
  
  const res = await fetch('/api/admin/empresa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (res.ok) showToast('Empresa atualizada com sucesso!');
});

// Salvar Contato
document.getElementById('formContato').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    telefone: document.getElementById('contTelefone').value,
    whatsapp: document.getElementById('contWhatsapp').value,
    email: document.getElementById('contEmail').value,
    endereco: document.getElementById('contEndereco').value
  };
  
  const res = await fetch('/api/admin/contato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (res.ok) showToast('Contato atualizado com sucesso!');
});

// SERVIÇOS
function renderServicos() {
  const container = document.getElementById('servicosList');
  container.innerHTML = '';
  
  siteData.servicos.forEach((servico, sIndex) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${servico.titulo}</h3>
        <button class="btn-danger" onclick="removeServico(${sIndex})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group">
        <label>Categoria (ID)</label>
        <input type="text" value="${servico.categoria}" onchange="updateServico(${sIndex}, 'categoria', this.value)">
      </div>
      <div class="form-group">
        <label>Título</label>
        <input type="text" value="${servico.titulo}" onchange="updateServico(${sIndex}, 'titulo', this.value)">
      </div>
      <div class="form-group">
        <label>Itens (um por linha)</label>
        <textarea rows="6" onchange="updateServicoItens(${sIndex}, this.value)">${servico.itens.join('\n')}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

function updateServico(index, field, value) {
  siteData.servicos[index][field] = value;
}

function updateServicoItens(index, value) {
  siteData.servicos[index].itens = value.split('\n').filter(i => i.trim());
}

function removeServico(index) {
  if (confirm('Remover esta categoria?')) {
    siteData.servicos.splice(index, 1);
    renderServicos();
  }
}

document.getElementById('btnAddServico').addEventListener('click', () => {
  siteData.servicos.push({
    categoria: 'nova-categoria',
    titulo: 'Nova Categoria',
    itens: ['Item 1', 'Item 2']
  });
  renderServicos();
});

document.getElementById('btnSaveServicos').addEventListener('click', async () => {
  const res = await fetch('/api/admin/servicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData.servicos)
  });
  if (res.ok) showToast('Serviços salvos com sucesso!');
});

// PORTFÓLIO
function renderPortfolio() {
  const container = document.getElementById('portfolioList');
  container.innerHTML = '';
  
  siteData.portfolio.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${item.titulo}</h3>
        <button class="btn-danger" onclick="removePortfolio(${index})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group">
        <label>Título</label>
        <input type="text" value="${item.titulo}" onchange="updatePortfolio(${index}, 'titulo', this.value)">
      </div>
      <div class="form-group">
        <label>Descrição</label>
        <textarea rows="2" onchange="updatePortfolio(${index}, 'descricao', this.value)">${item.descricao}</textarea>
      </div>
      <div class="form-group">
        <label>Categoria</label>
        <input type="text" value="${item.categoria}" onchange="updatePortfolio(${index}, 'categoria', this.value)">
      </div>
      <div class="form-group">
        <label>Foto Antes (caminho)</label>
        <input type="text" value="${item.antes}" onchange="updatePortfolio(${index}, 'antes', this.value)">
      </div>
      <div class="form-group">
        <label>Foto Depois (caminho)</label>
        <input type="text" value="${item.depois}" onchange="updatePortfolio(${index}, 'depois', this.value)">
      </div>
    `;
    container.appendChild(card);
  });
}

function updatePortfolio(index, field, value) {
  siteData.portfolio[index][field] = value;
}

function removePortfolio(index) {
  if (confirm('Remover este item?')) {
    siteData.portfolio.splice(index, 1);
    renderPortfolio();
  }
}

document.getElementById('btnAddPortfolio').addEventListener('click', () => {
  siteData.portfolio.push({
    titulo: 'Novo Projeto',
    descricao: 'Descrição do projeto',
    categoria: 'Elétrica',
    antes: 'fotos/imagem.jpg',
    depois: 'fotos/imagem.jpg'
  });
  renderPortfolio();
});

document.getElementById('btnSavePortfolio').addEventListener('click', async () => {
  const res = await fetch('/api/admin/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData.portfolio)
  });
  if (res.ok) showToast('Portfólio salvo com sucesso!');
});

// DEPOIMENTOS
function renderDepoimentos() {
  const container = document.getElementById('depoimentosList');
  container.innerHTML = '';
  
  siteData.depoimentos.forEach((dep, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${dep.nome}</h3>
        <button class="btn-danger" onclick="removeDepoimento(${index})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-group">
        <label>Nome</label>
        <input type="text" value="${dep.nome}" onchange="updateDepoimento(${index}, 'nome', this.value)">
      </div>
      <div class="form-group">
        <label>Local</label>
        <input type="text" value="${dep.local}" onchange="updateDepoimento(${index}, 'local', this.value)">
      </div>
      <div class="form-group">
        <label>Depoimento</label>
        <textarea rows="3" onchange="updateDepoimento(${index}, 'texto', this.value)">${dep.texto}</textarea>
      </div>
      <div class="form-group">
        <label>Estrelas (1-5)</label>
        <input type="number" min="1" max="5" value="${dep.estrelas}" onchange="updateDepoimento(${index}, 'estrelas', parseInt(this.value))">
      </div>
    `;
    container.appendChild(card);
  });
}

function updateDepoimento(index, field, value) {
  siteData.depoimentos[index][field] = value;
}

function removeDepoimento(index) {
  if (confirm('Remover este depoimento?')) {
    siteData.depoimentos.splice(index, 1);
    renderDepoimentos();
  }
}

document.getElementById('btnAddDepoimento').addEventListener('click', () => {
  siteData.depoimentos.push({
    nome: 'Novo Cliente',
    local: 'Cidade - Bairro',
    texto: 'Depoimento do cliente',
    estrelas: 5
  });
  renderDepoimentos();
});

document.getElementById('btnSaveDepoimentos').addEventListener('click', async () => {
  const res = await fetch('/api/admin/depoimentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData.depoimentos)
  });
  if (res.ok) showToast('Depoimentos salvos com sucesso!');
});

// IMAGENS
async function loadImages() {
  const res = await fetch('/api/admin/images');
  currentImages = await res.json();
  document.getElementById('statImagens').textContent = currentImages.length;
  renderImages();
}

function renderImages() {
  const grid = document.getElementById('imagesGrid');
  grid.innerHTML = '';
  
  currentImages.forEach(img => {
    const item = document.createElement('div');
    item.className = 'image-item';
    item.innerHTML = `
      <img src="${img}" alt="Imagem">
      <div class="copy-path" onclick="copyPath('${img}')">${img}</div>
    `;
    grid.appendChild(item);
  });
}

function copyPath(path) {
  navigator.clipboard.writeText(path);
  showToast('Caminho copiado: ' + path);
}

// Upload
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#1E88E5';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#e5e7eb';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#e5e7eb';
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

async function handleFiles(files) {
  for (const file of files) {
    const formData = new FormData();
    formData.append('imagem', file);
    
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      showToast('Imagem enviada: ' + data.filename);
    } else {
      showToast('Erro ao enviar imagem', 'error');
    }
  }
  loadImages();
}

// ALTERAR SENHA
document.getElementById('formSenha').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmSenha = document.getElementById('confirmSenha').value;
  
  if (novaSenha !== confirmSenha) {
    showToast('As senhas não coincidem', 'error');
    return;
  }
  
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaAtual, novaSenha })
  });
  
  const data = await res.json();
  
  if (res.ok) {
    showToast('Senha alterada com sucesso!');
    document.getElementById('formSenha').reset();
  } else {
    showToast(data.error, 'error');
  }
});

// EXPORTAR/IMPORTAR
document.getElementById('btnExport').addEventListener('click', () => {
  window.open('/api/admin/export');
});

document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        showToast('Dados importados com sucesso!');
        loadData();
      }
    } catch (err) {
      showToast('Erro ao importar arquivo', 'error');
    }
  };
  reader.readAsText(file);
});

// Inicializar
loadData();

// ORÇAMENTOS
let orcamentoEditando = null;

document.getElementById('btnNovoOrcamento').addEventListener('click', () => {
  orcamentoEditando = null;
  document.getElementById('modalTitle').textContent = 'Novo Orçamento';
  document.getElementById('formOrcamento').reset();
  document.getElementById('servicosOrcamento').innerHTML = '';
  document.getElementById('materiaisOrcamento').innerHTML = '';
  document.getElementById('modalOrcamento').classList.add('show');
});

function closeModal() {
  document.getElementById('modalOrcamento').classList.remove('show');
}

function addServicoOrc(descricao = '', valor = 0) {
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <input type="text" placeholder="Descrição do serviço" value="${descricao}" class="serv-desc">
    <input type="number" placeholder="Valor" step="0.01" value="${valor}" class="serv-valor" style="width:120px;">
    <button type="button" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
  `;
  document.getElementById('servicosOrcamento').appendChild(div);
}

function addMaterialOrc(descricao = '', valor = 0) {
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <input type="text" placeholder="Descrição do material" value="${descricao}" class="mat-desc">
    <input type="number" placeholder="Valor" step="0.01" value="${valor}" class="mat-valor" style="width:120px;">
    <button type="button" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
  `;
  document.getElementById('materiaisOrcamento').appendChild(div);
}

document.getElementById('formOrcamento').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const servicos = [];
  document.querySelectorAll('#servicosOrcamento .item-row').forEach(row => {
    const desc = row.querySelector('.serv-desc').value;
    const valor = parseFloat(row.querySelector('.serv-valor').value) || 0;
    if (desc) servicos.push({ descricao: desc, valor });
  });
  
  const materiais = [];
  document.querySelectorAll('#materiaisOrcamento .item-row').forEach(row => {
    const desc = row.querySelector('.mat-desc').value;
    const valor = parseFloat(row.querySelector('.mat-valor').value) || 0;
    if (desc) materiais.push({ descricao: desc, valor });
  });
  
  const totalServicos = servicos.reduce((sum, s) => sum + s.valor, 0);
  const totalMateriais = materiais.reduce((sum, m) => sum + m.valor, 0);
  const maoDeObra = parseFloat(document.getElementById('orcMaoDeObra').value) || 0;
  
  const orcamento = {
    cliente: document.getElementById('orcCliente').value,
    telefone: document.getElementById('orcTelefone').value,
    endereco: document.getElementById('orcEndereco').value,
    servicos,
    materiais,
    totalServicos,
    totalMateriais,
    maoDeObra,
    total: totalServicos + totalMateriais + maoDeObra,
    observacoes: document.getElementById('orcObservacoes').value
  };
  
  if (orcamentoEditando) {
    orcamento.id = orcamentoEditando;
    const res = await fetch(`/api/admin/orcamentos/${orcamentoEditando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orcamento)
    });
    if (res.ok) {
      showToast('Orçamento atualizado!');
      closeModal();
      loadOrcamentos();
    }
  } else {
    const res = await fetch('/api/admin/orcamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orcamento)
    });
    if (res.ok) {
      showToast('Orçamento criado!');
      closeModal();
      loadOrcamentos();
    }
  }
});

async function loadOrcamentos() {
  const res = await fetch('/api/admin/orcamentos');
  const orcamentos = await res.json();
  
  document.getElementById('statOrcamentos').textContent = orcamentos.length;
  
  const container = document.getElementById('orcamentosList');
  container.innerHTML = '';
  
  if (orcamentos.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px;">Nenhum orçamento cadastrado. Clique em "Novo Orçamento" para começar.</p>';
    return;
  }
  
  orcamentos.forEach(orc => {
    const card = document.createElement('div');
    card.className = 'orcamento-card';
    card.innerHTML = `
      <div class="orcamento-header">
        <div class="orcamento-info">
          <h3>${orc.cliente}</h3>
          <p><i class="fas fa-phone"></i> ${orc.telefone || 'N/A'}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${orc.endereco || 'N/A'}</p>
          <p><i class="fas fa-calendar"></i> ${new Date(orc.data).toLocaleDateString('pt-BR')}</p>
          <span class="orcamento-status status-${orc.status}">${orc.status}</span>
        </div>
        <div class="orcamento-actions">
          <button class="btn-pdf" onclick="gerarPDF(${orc.id})"><i class="fas fa-file-pdf"></i> PDF</button>
          <button class="btn-whatsapp" onclick="enviarWhatsApp(${orc.id})"><i class="fab fa-whatsapp"></i></button>
          <button class="btn-danger" onclick="excluirOrcamento(${orc.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="orcamento-total">Total: R$ ${orc.total.toFixed(2)}</div>
    `;
    container.appendChild(card);
  });
}

async function excluirOrcamento(id) {
  if (!confirm('Excluir este orçamento?')) return;
  
  const res = await fetch(`/api/admin/orcamentos/${id}`, {
    method: 'DELETE'
  });
  
  if (res.ok) {
    showToast('Orçamento excluído!');
    loadOrcamentos();
  }
}

function gerarPDF(id) {
  window.open(`/api/orcamento/${id}/pdf`, '_blank');
}

function enviarWhatsApp(id) {
  const orc = siteData.orcamentos?.find(o => o.id === id);
  if (!orc) return;
  
  const telefone = orc.telefone?.replace(/\D/g, '');
  const mensagem = encodeURIComponent(
    `Olá ${orc.cliente}! Segue o orçamento solicitado.\n\n` +
    `Total: R$ ${orc.total.toFixed(2)}\n\n` +
    `Qualquer dúvida, estamos à disposição!`
  );
  
  window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
}

// UPLOAD COM CATEGORIA
async function handleFiles(files) {
  const category = document.getElementById('uploadCategory').value;
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('imagem', file);
    formData.append('category', category);
    
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      showToast('Imagem enviada: ' + data.filename);
    } else {
      showToast('Erro ao enviar imagem', 'error');
    }
  }
  loadImages();
}

// Atualizar loadData para incluir orçamentos
const originalLoadData = loadData;
loadData = async function() {
  await originalLoadData();
  loadOrcamentos();
};
