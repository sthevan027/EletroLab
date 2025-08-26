# EletriLab - Sistema de Ensaios Elétricos

Sistema completo para gerenciamento de ensaios elétricos, incluindo testes Megger e Hipot, com geração automática de relatórios e análise de dados.

## 🚀 Funcionalidades

- **Dashboard Interativo**: Visualização de KPIs e estatísticas em tempo real
- **Gestão de Equipamentos**: Cadastro e controle de equipamentos elétricos
- **Testes Automatizados**: Suporte a testes Megger e Hipot com classificação automática
- **Geração de Relatórios**: Criação de relatórios detalhados com exportação PDF
- **Configuração de Parâmetros**: Personalização dos limites de teste por categoria
- **Interface Responsiva**: Design moderno com suporte a tema claro/escuro
- **Armazenamento Local**: Dados persistidos em IndexedDB com fallback para localStorage

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router DOM
- **Gráficos**: Chart.js + React Chart.js 2
- **Banco de Dados**: IndexedDB (Dexie.js)
- **Exportação**: html2pdf.js
- **Ícones**: Lucide React

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd eletrilab
```

2. Instale as dependências:
```bash
pnpm install
```

3. Execute o projeto:
```bash
pnpm dev
```

4. Acesse `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
eletrilab/
├── src/
│   ├── assets/             # Logos, ícones
│   ├── components/         # Componentes reutilizáveis
│   ├── db/                 # Configuração IndexedDB (Dexie)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas da aplicação
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Funções utilitárias
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Entry point
├── public/                 # Arquivos estáticos
├── documentos/             # Documentação do projeto
└── package.json
```

## 📋 Páginas Principais

- **Dashboard**: Visão geral com KPIs e gráficos
- **Novo Relatório**: Criação de relatórios com testes
- **Detalhes do Relatório**: Visualização completa de relatórios
- **Equipamentos**: Gestão de equipamentos elétricos
- **Parâmetros**: Configuração dos limites de teste

## 🎯 Tipos de Teste Suportados

### Megger (Resistência de Isolação)
- **Unidade**: MΩ (Megaohm)
- **Categorias**: Motor, Transformador, Gerador, Painel, Cabo, Outro
- **Classificação**: BOM, ACEITÁVEL, REPROVADO

### Hipot (Tensão de Isolação)
- **Unidade**: V (Volts)
- **Categorias**: Motor, Transformador, Gerador, Painel, Cabo, Outro
- **Classificação**: BOM, ACEITÁVEL, REPROVADO

## 📊 Distribuição de Probabilidade

O sistema gera valores aleatórios seguindo a distribuição:
- **60%** dos valores classificados como BOM
- **25%** dos valores classificados como ACEITÁVEL
- **15%** dos valores classificados como REPROVADO

## 🎨 Design System

- **Cores Primárias**: Azul (#3b82f6)
- **Tema**: Suporte a modo claro e escuro
- **Tipografia**: Inter (Google Fonts)
- **Componentes**: Design system consistente com Tailwind CSS

## 📱 Responsividade

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Layout otimizado para telas pequenas

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Executa o servidor de desenvolvimento
pnpm build        # Gera build de produção
pnpm preview      # Visualiza o build de produção
pnpm lint         # Executa o linter
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, consulte a documentação na pasta `documentos/` ou entre em contato com a equipe de desenvolvimento.
