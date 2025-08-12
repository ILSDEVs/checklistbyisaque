import { ProcessingFile } from "@/components/ProcessingStatus";

interface FileWithId extends File {
  id: string;
  path?: string; // Propriedade opcional para arquivos com path
}

// Coordenadas padrão para busca do número de série (canto superior esquerdo)
const DEFAULT_COORDINATES = {
  x: 50,      // pixels do lado esquerdo
  y: 50,      // pixels do topo
  width: 200, // largura da área de busca
  height: 100 // altura da área de busca
};

// Múltiplas coordenadas para busca do número de série
const COORDINATE_VARIATIONS = [
  { x: 50, y: 50, width: 200, height: 100 },     // Canto superior esquerdo
  { x: 200, y: 80, width: 250, height: 120 },   // Centro superior
  { x: 400, y: 50, width: 200, height: 100 },   // Canto superior direito
  { x: 100, y: 150, width: 300, height: 150 },  // Centro do documento
  { x: 50, y: 300, width: 400, height: 200 },   // Metade inferior
  { x: 300, y: 700, width: 200, height: 100 },  // Canto inferior direito
  { x: 50, y: 700, width: 200, height: 100 },   // Canto inferior esquerdo
];

// Simula a extração do número de série do PDF usando código de barras e coordenadas
const extractSerialNumberFromPDF = async (file: File): Promise<string | null> => {
  // Verifica se o arquivo e nome são válidos
  if (!file || !file.name) {
    console.error('Arquivo inválido ou sem nome:', file);
    throw new Error('Arquivo inválido ou corrompido');
  }

  // Simula tempo de processamento de leitura do PDF
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  
  console.log(`Processando arquivo: ${file.name}`);
  console.log(`Tamanho do arquivo: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Regex para o padrão 1X000000X
  const serialPattern = /\b1[A-Z][0-9]{6}[A-Z]\b/;
  
  // Simula diferentes cenários de processamento baseado no nome do arquivo
  const fileName = file.name.toLowerCase();
  
  // Simula PDF corrompido ou com erro
  if (fileName.includes('corrupt') || fileName.includes('erro')) {
    throw new Error('Arquivo PDF corrompido ou ilegível');
  }
  
  // Simula PDF protegido por senha
  if (fileName.includes('protect') || fileName.includes('senha')) {
    throw new Error('PDF protegido por senha');
  }
  
  // PRIMEIRA TENTATIVA: Leitura de código de barras
  console.log('Buscando código de barras no documento...');
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula tempo de busca de código de barras
  
  // Simula detecção de código de barras com alta taxa de sucesso
  const barcodeDetected = Math.random() > 0.2; // 80% de chance de detectar código de barras
  
  if (barcodeDetected) {
    console.log('Código de barras detectado, decodificando...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extrai o número de série do nome do arquivo (simulando leitura do código de barras)
    const fileNameWithoutExtension = file.name.replace('.pdf', '');
    const serialMatch = fileNameWithoutExtension.match(serialPattern);
    
    if (serialMatch) {
      const realSerialNumber = serialMatch[0].toUpperCase();
      console.log(`Número de série extraído do código de barras: ${realSerialNumber}`);
      return realSerialNumber;
    } else {
      console.log('Código de barras detectado mas não contém número de série válido');
    }
  } else {
    console.log('Nenhum código de barras detectado no documento');
  }
  
  // SEGUNDA TENTATIVA: Busca por coordenadas com múltiplas variações
  console.log('Iniciando busca por coordenadas em múltiplas áreas...');
  
  for (let i = 0; i < COORDINATE_VARIATIONS.length; i++) {
    const coords = COORDINATE_VARIATIONS[i];
    console.log(`Tentativa ${i + 1}/${COORDINATE_VARIATIONS.length}: Buscando nas coordenadas x=${coords.x}, y=${coords.y}, área=${coords.width}x${coords.height}px`);
    
    await new Promise(resolve => setTimeout(resolve, 400)); // Simula tempo de OCR
    
    // Simula OCR na área especificada
    if (fileName.includes('scan') || fileName.includes('imagem')) {
      console.log('Aplicando OCR na área delimitada...');
    }
    
    // Cada área tem uma chance diferente de sucesso
    const successRate = i === 0 ? 0.3 : i === 1 ? 0.4 : i === 2 ? 0.25 : 0.15; // Primeiras áreas têm mais chance
    const coordenateSearchSuccess = Math.random() < successRate;
    
    if (coordenateSearchSuccess) {
      // Extrai o número de série do nome do arquivo (simulando leitura das coordenadas)
      const fileNameWithoutExtension = file.name.replace('.pdf', '');
      const serialMatch = fileNameWithoutExtension.match(serialPattern);
      
      if (serialMatch) {
        const realSerialNumber = serialMatch[0].toUpperCase();
        console.log(`Número de série encontrado nas coordenadas ${i + 1}: ${realSerialNumber}`);
        return realSerialNumber;
      } else {
        console.log(`Texto encontrado nas coordenadas ${i + 1} mas não corresponde ao padrão esperado`);
      }
    } else {
      console.log(`Nenhum texto legível encontrado nas coordenadas ${i + 1}`);
    }
  }
  
  console.log('Número de série não encontrado após busca em todas as coordenadas');
  return null;
};

export const processFiles = async (
  files: FileWithId[],
  onProgress: (files: ProcessingFile[]) => void
): Promise<ProcessingFile[]> => {
  console.log(`Iniciando processamento de ${files.length} arquivos`);
  
  // Mapeia e converte os objetos file-like para formato esperado
  const validFiles = files.map(file => {
    // Se é um objeto com path, extrai o nome do arquivo
    if (file.path && !file.name) {
      const fileName = file.path.replace('./', ''); // Remove "./" do início
      return {
        ...file,
        name: fileName,
        size: 1024 * 1024, // Simula 1MB para cada arquivo
        type: 'application/pdf'
      };
    }
    return file;
  }).filter(file => file && file.name && file.name.length > 0);
  
  console.log(`Arquivos válidos processados: ${validFiles.length}/${files.length}`);
  
  if (validFiles.length !== files.length) {
    console.warn(`${files.length - validFiles.length} arquivos inválidos foram ignorados`);
  }

  const processingFiles: ProcessingFile[] = validFiles.map(file => ({
    id: file.id,
    name: file.name,
    status: 'pending'
  }));

  // Inicia o processamento
  onProgress(processingFiles);

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const processingFile = processingFiles[i];
    
    console.log(`Processando arquivo ${i + 1}/${validFiles.length}: ${file.name}`);
    
    // Marca como processando
    processingFile.status = 'processing';
    onProgress([...processingFiles]);
    
    try {
      const serialNumber = await extractSerialNumberFromPDF(file);
      
      if (serialNumber) {
        processingFile.status = 'success';
        processingFile.serialNumber = serialNumber;
        processingFile.newName = `${serialNumber}.pdf`;
        console.log(`Arquivo processado com sucesso: ${file.name} → ${serialNumber}.pdf`);
      } else {
        processingFile.status = 'error';
        processingFile.errorReason = 'Número de série não encontrado no padrão 1X000000X';
        console.log(`Número de série não encontrado no arquivo: ${file.name}`);
      }
    } catch (error) {
      processingFile.status = 'error';
      processingFile.errorReason = error instanceof Error ? error.message : 'Erro desconhecido durante processamento';
      console.error(`Erro ao processar arquivo ${file.name}:`, error);
    }
    
    onProgress([...processingFiles]);
  }
  
  console.log('Processamento concluído');
  return processingFiles;
};

export const generateZipFile = (files: ProcessingFile[]): void => {
  // Simula a geração do arquivo ZIP
  const successFiles = files.filter(f => f.status === 'success');
  
  // Cria um blob simulado para download
  const zipContent = `Arquivo ZIP simulado contendo ${successFiles.length} arquivos:\n\n` +
    successFiles.map(f => `${f.newName} (original: ${f.name})`).join('\n');
  
  const blob = new Blob([zipContent], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `checklists_renomeados_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};

export const generateReport = (files: ProcessingFile[]): void => {
  // Gera relatório em formato CSV
  const headers = ['Nome Original', 'Status', 'Número de Série', 'Novo Nome', 'Motivo do Erro'];
  const rows = files.map(f => [
    f.name,
    f.status === 'success' ? 'Processado' : 'Erro',
    f.serialNumber || '-',
    f.newName || '-',
    f.errorReason || '-'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_processamento_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};
