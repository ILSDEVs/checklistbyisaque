import { ProcessingFile } from "@/components/ProcessingStatus";
import JSZip from "jszip";
import * as pdfjsLib from 'pdfjs-dist';

interface FileWithId extends File {
  id: string;
  path?: string; // Propriedade opcional para arquivos com path
}

// Configura o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Função universal para ler arquivo como ArrayBuffer
const readFileAsArrayBuffer = (file: any): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    console.log('Tentando ler arquivo:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      constructor: file?.constructor?.name,
      isFile: file instanceof File,
      isBlob: file instanceof Blob,
      hasArrayBuffer: typeof file?.arrayBuffer === 'function'
    });
    
    // Se o arquivo tem arrayBuffer nativo, usa ele
    if (file instanceof File && typeof file.arrayBuffer === 'function') {
      console.log('Usando arrayBuffer nativo...');
      file.arrayBuffer()
        .then(resolve)
        .catch(reject);
      return;
    }
    
    // Senão, usa FileReader
    console.log('Usando FileReader...');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Extrai o número de série do PDF lendo o conteúdo real
const extractSerialNumberFromPDF = async (file: any): Promise<string | null> => {
  // Verifica se o arquivo é válido
  if (!file || !file.name) {
    console.error('Arquivo inválido ou sem nome:', file);
    throw new Error('Arquivo inválido ou corrompido');
  }

  console.log(`Processando arquivo: ${file.name}`);
  console.log(`Tamanho do arquivo: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Regex para o padrão 1X000000X (1 dígito, 1 letra, 6 dígitos, 1 letra)
  const serialPattern = /\b1[A-Z][0-9]{6}[A-Z]\b/g;
  
  try {
    // Converte o arquivo para ArrayBuffer usando método universal
    console.log('Carregando conteúdo do arquivo...');
    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    // Carrega o PDF
    console.log('Carregando PDF...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF carregado com ${pdf.numPages} página(s)`);
    
    // Processa todas as páginas do PDF
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processando página ${pageNum}/${pdf.numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extrai todo o texto da página
      const fullText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      console.log(`Texto extraído da página ${pageNum} (${fullText.length} caracteres)`);
      
      // PRIMEIRA TENTATIVA: Procura especificamente por "BCode Serial" seguido do número
      const bcodeSerialMatch = fullText.match(/BCode\s*Serial[:\s]*([1][A-Z][0-9]{6}[A-Z])/i);
      if (bcodeSerialMatch) {
        const serialNumber = bcodeSerialMatch[1].toUpperCase();
        console.log(`BCode Serial encontrado na página ${pageNum}: ${serialNumber}`);
        return serialNumber;
      }
      
      // SEGUNDA TENTATIVA: Procura pelo padrão 1X000000X em qualquer lugar do texto
      const serialMatches = fullText.match(serialPattern);
      if (serialMatches && serialMatches.length > 0) {
        // Se encontrar múltiplas correspondências, pega a primeira
        const serialNumber = serialMatches[0].toUpperCase();
        console.log(`Número de série encontrado na página ${pageNum}: ${serialNumber}`);
        return serialNumber;
      }
      
      console.log(`Nenhum número de série encontrado na página ${pageNum}`);
    }
    
    console.log('Número de série não encontrado em nenhuma página do PDF');
    return null;
    
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    
    // Verifica erros específicos
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Arquivo PDF corrompido ou inválido');
      } else if (error.message.includes('password')) {
        throw new Error('PDF protegido por senha');
      } else {
        throw new Error(`Erro ao ler PDF: ${error.message}`);
      }
    }
    
    throw new Error('Erro desconhecido ao processar PDF');
  }
};

export const processFiles = async (
  files: FileWithId[],
  onProgress: (files: ProcessingFile[]) => void
): Promise<ProcessingFile[]> => {
  console.log(`Iniciando processamento de ${files.length} arquivos`);
  
  // Processa os arquivos, seja de File real ou objeto com path
  const validFiles = files.map(file => {
    console.log('Arquivo recebido:', {
      name: file.name,
      path: file.path,
      size: file.size,
      type: file.type,
      id: file.id
    });
    
    // Se tem path mas não tem name, extrai o nome do path
    if (file.path && !file.name) {
      const fileName = file.path.replace('./', '');
      return {
        ...file,
        name: fileName,
        size: file.size || 1024 * 1024, // 1MB padrão se não tiver size
        type: file.type || 'application/pdf'
      };
    }
    return file;
  }).filter(file => {
    const isValid = file && file.name && file.name.length > 0;
    if (!isValid) {
      console.warn(`Arquivo inválido ignorado:`, file);
    }
    return isValid;
  });
  
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

export const generateZipFile = async (files: ProcessingFile[], originalFiles: FileWithId[]): Promise<void> => {
  console.log('Iniciando geração do ZIP...');
  console.log('Arquivos processados:', files.map(f => ({ id: f.id, name: f.name, status: f.status })));
  console.log('Arquivos originais:', originalFiles.map(f => ({ id: f.id, name: f.name, type: typeof f })));
  
  const successFiles = files.filter(f => f.status === 'success');
  
  if (successFiles.length === 0) {
    console.warn('Nenhum arquivo processado com sucesso para incluir no ZIP');
    return;
  }
  
  const zip = new JSZip();
  
  // Adiciona cada arquivo renomeado ao ZIP preservando o conteúdo original
  for (const file of successFiles) {
    console.log(`Processando arquivo para ZIP: ${file.name} (ID: ${file.id})`);
    const originalFile = originalFiles.find(orig => orig.id === file.id);
    
    if (originalFile) {
      console.log(`Arquivo original encontrado: ${originalFile.name}, tipo: ${typeof originalFile}`);
      try {
        // Usa a função universal para ler o arquivo
        console.log('Lendo conteúdo original do arquivo para o ZIP...');
        const arrayBuffer = await readFileAsArrayBuffer(originalFile);
        
        // Adiciona ao ZIP com o novo nome mas conteúdo original
        zip.file(file.newName || `${file.serialNumber}.pdf`, arrayBuffer);
        console.log(`Arquivo ${file.name} adicionado ao ZIP como ${file.newName} com conteúdo original preservado`);
      } catch (error) {
        console.error(`Erro ao ler conteúdo original do arquivo ${file.name}:`, error);
        // Se falhar, pula este arquivo
        continue;
      }
    } else {
      console.warn(`Arquivo original não encontrado para ${file.name} (ID: ${file.id})`);
    }
  }
  
  // Gera o ZIP
  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklists_renomeados_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    console.log(`ZIP gerado com sucesso contendo ${successFiles.length} arquivos`);
  } catch (error) {
    console.error('Erro ao gerar arquivo ZIP:', error);
    throw new Error('Falha na geração do arquivo ZIP');
  }
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
