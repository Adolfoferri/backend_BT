require('dotenv').config();

const path = require('path'); // Importar o módulo 'path'
const fs = require('fs'); // Para verificar e criar a pasta 'uploads'

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Adicione essa linha
const nodemailer = require('nodemailer');
const crypto = require('crypto');



const app = express();
app.use(cors({
  origin: '*', // ou 'https://meuappmobile.com'
}));
app.use(express.json());

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure o Cloudinary com suas credenciais
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//---------------------------------------------------função para recuperar senha---------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
//------------------------------------------------------------------------------------------------------------------

// ---------- CONEXÃO COM O BANCO E CRIAÇÃO DO ADMIN ---------------------------------------------------------------------------------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,  //isso não precisa
  useUnifiedTopology: true,  //isso não precisa
}).then(async () => {
  console.log('MongoDB conectado!');

  const adminEmail = 'admin@seusite.com';
  const adminExists = await User.findOne({ email: adminEmail });

  if (!adminExists) {
    const senhaHash = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      nome: 'Administrador',
      email: adminEmail,
      senha: senhaHash,
      aprovado: true,
      role: 'admin',
    });

    await adminUser.save();
    console.log('Usuário admin criado com sucesso!');
  } else {
    console.log('Usuário admin já existe.');
  }
}).catch((err) => console.error('Erro ao conectar ao MongoDB:', err));
// ---------------------------------------------------------------------------------------------------------------------------------------------------



//--------------------Criação da pasta 'uploads' se ela não existir----------------------------
const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}
//-----------------criar pasta pdf------------------------------------------------------------
// const pdfDir = path.join(__dirname, 'uploads/pdfs');
// if (!fs.existsSync(pdfDir)) {
//   fs.mkdirSync(pdfDir, { recursive: true });
// }


//----------Configuração do upload de imagem com multer no local---------------------------------------
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Nome da imagem
//   },
// });
// const upload = multer({ storage: storage });
//-------------------------------------------------------------------------------------------
//----------------uploads dpf cartilhas-------------------------------------------------------
// const pdfStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/pdfs');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });

// const pdfUpload = multer({ storage: pdfStorage });
//------------------------------------------------------
//----------------  salvando imagem no CloudinaryStorage-------------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',  // pasta no Cloudinary onde os arquivos serão armazenados
    resource_type: 'raw',  // MUITO IMPORTANTE para arquivos pdf
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],  // formatos permitidos
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite: 5MB por arquivo
});

//--------------------------------------------------------------------------------


// ----------- SCHEMA E MODEL DEFINIDOS UMA VEZ SÓ ------------
const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  aprovado: { type: Boolean, default: true },
  resetToken: { type: String },
tokenExpira: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // campo role adicionado
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
// ------------------------Grupo------------------------------------
const grupoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  lider: { type: String },
  dia: { type: String },
  horario: { type: String },
  bairro: { type: String },
  whatsapp: { type: String, required: true },
}, {
  timestamps: true,
});

const Grupo = mongoose.model('Grupo', grupoSchema);
//-----------------------------------------------------------------
//----------------------------video-------------------------------
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);
//---------------------------------------------------------
//--------------- -Notícia------------------------------
const noticiaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  imagem: { type: String, required: true }, // A URL da imagem será salva no banco de dados
});

const Noticia = mongoose.model('Noticia', noticiaSchema);
//----------------------------------------------------------
//---------------testemunhos---------------------------
const testemunhoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  texto: { type: String, required: true },
}, {
  timestamps: true  // 👉 cria automaticamente "createdAt" e "updatedAt"
});

const Testemunho = mongoose.model('Testemunho', testemunhoSchema);
//-----------------------------------------------------------------
//----------------cartilhas-----------------------------------

const cartilhaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
}, { timestamps: true });

const Cartilha = mongoose.model('Cartilha', cartilhaSchema);
//---------------------------------------------------------------
//-------------------------------------------------------------missoes--------------------------------------------------------
//------------------ missionarios==========
const missionarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
});

const Missionario = mongoose.model('Missionario', missionarioSchema);
//-----------------------------------------------------------
//-----------------agenda--------------------------
const agendaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  data: { type: String, required: true },
});

const Agenda = mongoose.model('Agenda', agendaSchema);
//---------------------------------------------------------------------------------------------------------------------------
//-------------------------visitas---------------
const visitaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  endereco: { type: String, required: true },
  motivo: { type: String, required: true },
  data: { type: String, required: true },
});

const Visita = mongoose.model('Visita', visitaSchema)
//--------------------------------------------------------
//------------------devovional----------------------
const devocionalSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  versiculo:{ type: String, required: true },
  texto: { type: String, required: true },
});

const Devocional = mongoose.model('Devocional', devocionalSchema);
//---------------------------------------------------------------------
//----------------------transaçoes----------------------------------
const transacaoSchema = new mongoose.Schema({
  descricao: { type: String, required: true },
  valor: { type: Number, required: true },
  tipo: { type: String, enum: ['entrada', 'saida'], required: true },
  categoria: { type: String, required: true },
  data: { type: Date, default: Date.now },
});

const Transacao = mongoose.model('Transacao', transacaoSchema);
//------------------------------------------------------------------------
//-----------------Eventos------------------------------------
const eventoSchema = new mongoose.Schema({
  title:{ type: String, required: true },
  data: { type: String, required: true },
  hora: { type: String, required: true },  // Novo campo para a hora
  local: { type: String, required: true },
  link:{ type: String, required: false },
});

const Evento = mongoose.model('Evento', eventoSchema);
//-----------------------------------------------------------------
//-------------------pedido de oração------------------------------
const pedidoOracaoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  texto: { type: String, required: true },
  data: { type: Date, default: Date.now },
});

const PedidoOracao = mongoose.model('PedidoOracao', pedidoOracaoSchema);
//-----------------------------------------------------------------------
//-----------------------fotos---------------------------------
const fotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  titulo:{ type: String, required: true },
  descricao: { type: String, required: true },
  data: { type: Date, default: Date.now }
});
const Foto = mongoose.model('Foto', fotoSchema);
//-----------------------------------------------------------
//--------------------destaque igreja-------------------
const destaqueSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  text: { type: String, required: true },
});

const Destaque = mongoose.model('Destaque', destaqueSchema);



// ----------- ROTAS DE CADASTRO E LOGIN ----------------------

app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existente = await User.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = new User({ nome, email, senha: senhaHash });
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    if (!user.aprovado) {
      return res.status(403).json({ error: 'Seu cadastro ainda não foi aprovado.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login realizado com sucesso', token, nome: user.nome, role: user.role });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ------------------------------------------------------------

// -------------------Listar usuários pendentes---------------
app.get('/api/usuarios/pendentes', async (req, res) => {
  try {
    const pendentes = await User.find({ aprovado: false });
    res.json(pendentes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários pendentes.' });
  }
});
//-----------------------------------------------------------

//--------------- Aprovar usuário--------------------------
app.patch('/api/usuarios/aprovar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { aprovado: true });
    res.json({ message: 'Usuário aprovado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar usuário.' });
  }
});
//-------------------------------------------------------------

//------------------ Criar novo grupo-------------------
app.post('/api/grupos', async (req, res) => {
  try {
    const grupo = new Grupo(req.body);
    const grupoSalvo = await grupo.save();
    res.status(201).json(grupoSalvo);
  } catch (err) {
    console.error('Erro ao salvar grupo no servidor:', err);
    res.status(400).json({ erro: 'Erro ao salvar grupo', detalhes: err.message });
  }
});


//--------------------------------------------------------------

// ------------------- Buscar todos os grupos----------------
app.get('/api/grupos', async (req, res) => {
  try {
    const grupos = await Grupo.find();
    res.json(grupos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar grupos' });
  }
});
//---------------------------------------------------

//------------------ Deletar grupo------------------
app.delete('/api/grupos/:id', async (req, res) => {
  try {
    await Grupo.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Grupo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir grupo' });
  }
});
//-----------------------------------------------------

//-------------------GET: Listar vídeos--------------
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});
//-------------------------------------------

//-------------- POST: Adicionar vídeo------------
app.post('/api/videos', async (req, res) => {
  const { title, url } = req.body;
  try {
    const novoVideo = new Video({ title, url });
    await novoVideo.save();
    res.status(201).json(novoVideo);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao adicionar vídeo' });
  }
});
//------------------------------------------------------

// -----------------DELETE: Excluir vídeo-------------
app.delete('/api/videos/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vídeo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir vídeo' });
  }
});
//----------------------------------------------------

//------------- Torna a pasta 'uploads' acessível publicamente-----------------------------------------------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------- salvar a notícia-----------------
app.post('/api/noticias', upload.single('imagem'), async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    const imagem = req.file ? req.file.path : null; // Salva o caminho da imagem

    const noticia = new Noticia({ titulo, descricao, imagem });
    await noticia.save();
    
    res.status(201).json(noticia);
  } catch (error) {
    console.error('Erro ao salvar a notícia:', error);
    res.status(500).json({ error: 'Erro ao salvar a notícia' });
  }
});
// app.post('/api/noticias', upload.single('imagem'), async (req, res) => {
//   try {
//     const { titulo, descricao } = req.body;

//     if (!titulo || !descricao) {
//       return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
//     }

//     let imagemUrl = null;

//     if (req.file) {
//       console.log('Arquivo recebido:', req.file.path);

//       // Faz upload para Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path);
//       console.log('Upload para Cloudinary OK:', result.secure_url);

//       imagemUrl = result.secure_url;
//     } else {
//       console.log('Nenhum arquivo enviado');
//     }

//     const noticia = new Noticia({ titulo, descricao, imagem: imagemUrl });
//     await noticia.save();

//     res.status(201).json(noticia);
//   } catch (error) {
//     console.error('Erro ao salvar a notícia:', error);
//     res.status(500).json({ error: 'Erro ao salvar a notícia' });
//   }
// });

//-----------------------------------------------------------------------
//---------------------------obter todas as notícias-------------------
app.get('/api/noticias', async (req, res) => {
  try {
    const noticias = await Noticia.find();
    res.status(200).json(noticias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter as notícias' });
  }
});
//----------------------------------------------------------------
//---------------------deletar noticias -------------------------
app.delete('/api/noticias/:id', async (req, res) => {
  try {
    console.log('Excluindo notícia ID:', req.params.id);
    const noticia = await Noticia.findByIdAndDelete(req.params.id);
    if (!noticia) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }
    res.status(200).json({ message: 'Notícia excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notícia:', error);
    res.status(500).json({ error: 'Erro ao excluir notícia' });
  }
});
//----------------------------------------------------------------------

//-----------------------testemunhos------------------------
// app.post('/api/testemunhos', async (req, res) => {
//   try {
//     const { texto } = req.body;
//     if (!texto) {
//       return res.status(400).json({ error: 'Texto do testemunho é obrigatório.' });
//     }

//     const novoTestemunho = new Testemunho({ texto });
//     await novoTestemunho.save();

//     res.status(201).json(novoTestemunho);
//   } catch (err) {
//     res.status(500).json({ error: 'Erro ao salvar testemunho.' });
//   }
// });
app.post('/api/testemunhos', async (req, res) => {
  try {
    const { nome, texto } = req.body;
    if (!texto) {
      return res.status(400).json({ error: 'Texto do testemunho é obrigatório.' });
    }

    const novoTestemunho = new Testemunho({ nome, texto });
    await novoTestemunho.save();

    res.status(201).json(novoTestemunho);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar testemunho.' });
  }
});

//----------------------------------------------------------------

//------------------buscar testemunhos-----------------------------
app.get('/api/testemunhos', async (req, res) => {
  try {
    const lista = await Testemunho.find().sort({ createdAt: -1 });
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar testemunhos.' });
  }
});
//------------------------------------------------------------


//------------------Adicionar cartilha----------------------
app.post('/api/cartilhas', upload.single('pdf'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ error: 'Título e arquivo PDF são obrigatórios.' });
    }

    // Upload do PDF no Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'raw', // necessário para PDF
      folder: 'cartilhas'    // opcional: cria uma pasta no Cloudinary
    });

    // Salva a cartilha com o link correto do Cloudinary
    const novaCartilha = new Cartilha({
      title,
      url: result.secure_url // URL HTTPS da cartilha
    });

    await novaCartilha.save();
    res.status(201).json(novaCartilha);

  } catch (error) {
    console.error('Erro ao salvar cartilha:', error);
    res.status(500).json({ error: 'Erro ao salvar a cartilha.' });
  }
});
//------------------------------------------------------------

//----------Buscar todas as cartilhas----------------------
app.get('/api/cartilhas', async (req, res) => {
  try {
    const cartilhas = await Cartilha.find().sort({ createdAt: -1 });
    res.json(cartilhas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cartilhas.' });
  }
});
///---------------------------------------------------------------------

// Criar novo missionário
app.post('/api/missionarios', async (req, res) => {
  const { nome, descricao } = req.body;
  try {
      const missionario = new Missionario({ nome, descricao });
      await missionario.save();
      res.status(201).json(missionario);
  } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar missionário' });
  }
});

//--------------------Obter todos os missionários-------------------
app.get('/api/missionarios', async (req, res) => {
  try {
      const missionarios = await Missionario.find();
      res.status(200).json(missionarios);
  } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar missionários' });
  }
});
//--------------------------------------------------------------------

//------------------Excluir missionário---------------------
app.delete('/api/missionarios/:id', async (req, res) => {
  try {
      console.log('Excluindo missionário ID:', req.params.id);
      const missionario = await Missionario.findByIdAndDelete(req.params.id);
      if (!missionario) {
          return res.status(404).json({ error: 'Missionário não encontrado' });
      }
      res.status(200).json({ message: 'Missionário excluído com sucesso' });
  } catch (error) {
      console.error('Erro ao excluir missionário:', error);
      res.status(500).json({ error: 'Erro ao excluir missionário' });
  }
});

//-----------------------------------------------------------------

//---------------------Criar nova agenda--------------------------
app.post('/api/agenda', async (req, res) => {
  const { titulo, descricao, data } = req.body;
  try {
      const agenda = new Agenda({ titulo, descricao, data });
      await agenda.save();
      res.status(201).json(agenda);
  } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar agenda' });
  }
});
//----------------------------------------------------------------------

//-------------------------Obter todas as agendas-------------------
app.get('/api/agenda', async (req, res) => {
  try {
      const agenda = await Agenda.find();
      res.status(200).json(agenda);
  } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar agendas' });
  }
});
//------------------------------------------------------------------
//--------------------- excluir agenda--------------------------
app.delete('/api/agenda/:id', async (req, res) => {
  try {
    const agendaId = req.params.id;

    // Verifica se o ID é válido
    if (!agendaId) {
      return res.status(400).json({ message: 'ID da agenda não fornecido.' });
    }

    // Converte o ID para ObjectId
    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(agendaId)) {
      return res.status(400).json({ message: 'ID da agenda inválido.' });
    }

    // Tenta excluir a agenda
    const result = await Agenda.deleteOne({ _id: agendaId });

    // Verifica se a exclusão foi bem-sucedida
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Agenda não encontrada.' });
    }

    res.status(200).json({ message: 'Agenda excluída com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir a agenda.' });
  }
});
//----------------------------------------------------------------

//-------------------Rota para salvar a visita----------------
app.post('/api/visitas', async (req, res) => {
  const visita = new Visita(req.body);
  await visita.save();
  res.status(201).json(visita);
});
//--------------------------------------------------------

//----------------------Rota para listar visitas---------------
app.get('/api/visitas', async (req, res) => {
  const visitas = await Visita.find();
  res.json(visitas);
});
//------------------------------------------------------

//------------criar um novo devocional------------------
// app.post('/api/devocionais', async (req, res) => {
//   try {
//     console.log('Body recebido:', req.body); // 👈 Log do corpo recebido
//     const devocional = new Devocional(req.body);
//     await devocional.save();
//     res.status(201).json(devocional);
//   } catch (error) {
//     console.error('Erro ao salvar devocional:', error); // 👈 Mostra o erro no terminal
//     res.status(500).json({ error: 'Erro ao salvar devocional' });
//   }
// });
app.post('/api/devocionais', async (req, res) => {
  try {
    const devocional = new Devocional(req.body);
    await devocional.save();
    res.status(201).json(devocional);
  } catch (error) {
    console.error('Erro ao salvar devocional:', error);
    res.status(500).json({ error: 'Erro ao salvar devocional' });
  }
});
//-------------------------------------------------

// app.get('/api/devocionais', async (req, res) => {
//   try {
//     // Busca os devocionais de forma assíncrona com async/await
//     const devocionais = await Devocional.find(); // Não use callback, use await para retornar uma Promise
//     res.json(devocionais);
//   } catch (error) {
//     console.error('Erro ao buscar devocionais:', error);
//     res.status(500).send('Erro ao buscar devocionais');
//   }
// });
app.get('/api/devocionais', async (req, res) => {
  try {
    const devocionais = await Devocional.find().sort({ createdAt: 1 });
    res.json(devocionais);
  } catch (error) {
    console.error('Erro ao buscar devocionais:', error);
    res.status(500).send('Erro ao buscar devocionais');
  }
});

//-----------------------postar transações----------------------------

app.post('/api/transacoes', async (req, res) => {
  try {
    const novaTransacao = new Transacao(req.body);
    const transacaoSalva = await novaTransacao.save();
    res.status(201).json(transacaoSalva);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao salvar transação' });
  }
});

//------------------- Buscar todas as transações---------------------------
app.get('/api/transacoes', async (req, res) => {
  try {
    const transacoes = await Transacao.find().sort({ data: -1 });
    res.json(transacoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar transações' });
  }
});
//------------------------------------------------------------------
//-------------------postando eventos-----------------------------
app.post('/api/eventos', async (req, res) => {
  try {
    const novoEvento = new Evento(req.body);
    const eventoSalvo = await novoEvento.save();
    res.status(201).json(eventoSalvo);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao salvar evento' });
  }
});
//---------------------------------------------------------------
//--------------------buscando eventos----------------------------
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await Evento.find().sort({ _id: -1 });
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar eventos' });
  }
});
//------------------------------------------------------------------

//--------------------postar pedidos-----------------------------
// app.post('/api/pedidos', async (req, res) => {
// try {
//     // Usando o modelo correto "PedidoOracao" para criar um novo pedido
//     const novoPedido = new PedidoOracao({texto: req.body.texto });
//     const salvo = await novoPedido.save();
//     res.status(201).json(salvo); // Retornando o pedido salvo
//   } catch (err) {
//     console.error('Erro ao salvar no banco:', err);
//     res.status(400).json({ erro: 'Erro ao salvar pedido', detalhe: err.message });
//   }
// });
app.post('/api/pedidos', async (req, res) => {
  try {
    const { nome, texto } = req.body;

    if (!texto) {
      return res.status(400).json({ error: 'Texto é obrigatório.' });
    }

    const novoPedido = new PedidoOracao({ nome, texto });
    await novoPedido.save();

    res.status(201).json(novoPedido);
  } catch (err) {
    console.error('Erro ao salvar pedido:', err);
    res.status(500).json({ error: 'Erro ao salvar o pedido.' });
  }
});


//----------------------------------------------------------

//---------------------buscar pedidos-------------------------
app.get('/api/pedidos', async (req, res) => {
  try {
    // Usando o modelo correto "PedidoOracao" para buscar os pedidos
    const pedidos = await PedidoOracao.find().sort({ data: -1 });
    res.json(pedidos); // Retornando os pedidos encontrados
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

//------------------------------------------------------------
//---------------post fotos----------------------------------
app.post('/api/fotos', upload.single('imagem'), async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    const relativePath = `${req.file.filename}`;

    const novaFoto = new Foto({ url: relativePath, titulo, descricao });
    await novaFoto.save();
    res.status(201).json(novaFoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao salvar imagem' });
  }
});
// app.post('/api/fotos', upload.single('imagem'), async (req, res) => {
//   try {
//     const { titulo, descricao } = req.body;

//     // Fazer upload para Cloudinary
//     const result = await cloudinary.uploader.upload(req.file.path);

//     // result.url tem a URL completa da imagem no Cloudinary
//     const novaFoto = new Foto({
//       url: result.url, // aqui tem que salvar a URL completa do Cloudinary
//       titulo,
//       descricao,
//     });

//     await novaFoto.save();
//     res.status(201).json(novaFoto);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ erro: 'Erro ao salvar imagem' });
//   }
// });

//------------------------------------------------------------------------------
//---------------Rota para listar imagens-----------------
app.get('/api/fotos', async (req, res) => {
  try {
    const fotos = await Foto.find().sort({ data: -1 });
    res.json(fotos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});
//--------------------------------------------------------

app.get('/api/destaques', async (req, res) => {
  try {
    const destaques = await Destaque.find();
    res.json(destaques);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar destaques' });
  }
});

// Rota PUT para atualizar todos os destaques (substitui tudo)
app.put('/api/destaques', async (req, res) => {
  try {
    const novosDestaques = req.body; // espera um array

    if (!Array.isArray(novosDestaques)) {
      return res.status(400).json({ error: 'Array esperado' });
    }

    // Apaga todos os destaques atuais
    await Destaque.deleteMany({});

    // Insere os novos destaques
    const inseridos = await Destaque.insertMany(novosDestaques);

    res.json(inseridos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar destaques' });
  }
});

//------------------------recuperar senha----------------------------------------------------------------------------------------------------------------------
// app.post('/recuperar-senha', async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) {
//     return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinição.' });
//   }

//   const token = crypto.randomBytes(32).toString('hex');
//   const tokenExpira = Date.now() + 3600000; // 1 hora

//   user.resetToken = token;
//   user.tokenExpira = tokenExpira;
//   await user.save();

//   const resetLink = `${process.env.BASE_URL}/redefinir-senha/${token}`;
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: user.email,
//     subject: 'Redefinição de Senha',
//     text: `Clique no link para redefinir sua senha: ${resetLink}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'E-mail de recuperação enviado!' });
//   } catch (error) {
//     res.status(500).json({ message: 'Erro ao enviar o e-mail' });
//   }
// });

app.post('/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinição.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpira = Date.now() + 3600000; // 1 hora

  user.resetToken = token;
  user.tokenExpira = tokenExpira;
  await user.save();

  const resetLink = `${process.env.BASE_URL}/redefinir-senha/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Redefinição de Senha',
    text: `Clique no link para redefinir sua senha: ${resetLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'E-mail de recuperação enviado!' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ message: 'Erro ao enviar o e-mail' });
  }
});
//----------------------------ROTA 2 - Redefinir a senha----------------------
// app.post('/redefinir-senha', async (req, res) => {
//   const { token, novaSenha } = req.body;

//   const user = await User.findOne({
//     resetToken: token,
//     tokenExpira: { $gt: Date.now() }
//   });

//   if (!user) {
//     return res.status(400).json({ message: 'Token inválido ou expirado' });
//   }

//   const senhaHash = await bcrypt.hash(novaSenha, 10);
//   user.senha = senhaHash;
//   user.resetToken = undefined;
//   user.tokenExpira = undefined;
//   await user.save();

//   res.json({ message: 'Senha redefinida com sucesso!' });
// });
app.post('/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
  }

  // Exemplo básico de validação simples da senha
  if (novaSenha.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      tokenExpira: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    user.senha = senhaHash;
    user.resetToken = undefined;
    user.tokenExpira = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});
//----------------------------rota uploads-------------------------
// app.post('/upload', upload.single('imagem'), async (req, res) => {
//   try {
//     const fileUrl = req.file?.path?.includes('cloudinary.com') ? req.file.path : req.file?.secure_url;
//     const { titulo, descricao } = req.body;

//     if (!fileUrl) {
//       return res.status(400).json({ error: 'Arquivo não enviado corretamente.' });
//     }
//     if (!titulo || !descricao) {
//       return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
//     }

//     const novaFoto = new Foto({
//       url: fileUrl,
//       titulo,
//       descricao,
//     });

//     await novaFoto.save();

//     res.status(200).json({ foto: novaFoto });
//   } catch (error) {
//     console.error('Erro no upload:', error);
//     res.status(500).json({ error: 'Erro ao fazer upload e salvar a foto.' });
//   }
// });




//-------------------------------------------------------------------------------------------------------------------------------------------------------

async function seedDestaques() {
  const dadosIniciais = [
    { icon: 'sunny', text: 'Domingo: Culto da Família - 18h' },
    { icon: 'book', text: 'Segunda: Oração no Lar - 20h' },
    { icon: 'school', text: 'Terça: Discipulado - 19h30' },
    { icon: 'book', text: 'Quarta: Estudo Bíblico - 19h' },
    { icon: 'people', text: 'Quinta: Círculo de Oração - 15h' },
    { icon: 'moon', text: 'Sexta: Vigília - 22h' },
    { icon: 'musical-notes', text: 'Sábado: Ensaio do Louvor - 17h' },
  ];

  await Destaque.deleteMany({});
  await Destaque.insertMany(dadosIniciais);
  console.log('Destaques inseridos com sucesso!');
}

// Chama a função para popular os destaques (se quiser rodar só uma vez, descomente)
seedDestaques();

app.get('/ping', (req, res) => {
  res.send('pong');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
