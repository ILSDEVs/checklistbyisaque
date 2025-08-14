import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus, ProcessingFile } from "@/components/ProcessingStatus";
import { ProcessingReport } from "@/components/ProcessingReport";
import { processFiles, generateZipFile, generateReport } from "@/utils/pdfProcessor";
import { Settings, FileText, Zap } from "lucide-react";
import { toast } from "sonner";

interface FileWithId extends File {
  id: string;
}

const Index = () => {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleFilesChange = (newFiles: FileWithId[]) => {
    setFiles(newFiles);
    setProcessingFiles([]);
    setHasProcessed(false);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo PDF");
      return;
    }

    setIsProcessing(true);
    setHasProcessed(false);
    toast.info("Iniciando processamento dos arquivos...");

    try {
      const result = await processFiles(files, setProcessingFiles);
      setProcessingFiles(result);
      setHasProcessed(true);
      
      const successCount = result.filter(f => f.status === 'success').length;
      const errorCount = result.filter(f => f.status === 'error').length;
      
      toast.success(`Processamento concluído! ${successCount} sucessos, ${errorCount} erros`);
    } catch (error) {
      toast.error("Erro durante o processamento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      toast.info("Gerando arquivo ZIP...");
      await generateZipFile(processingFiles);
      toast.success("Arquivo ZIP gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar arquivo ZIP");
    }
  };

  const handleDownloadReport = () => {
    generateReport(processingFiles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary to-primary-hover rounded-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Renomeador de Checklists</h1>
                <p className="text-sm text-muted-foreground">
                  Processamento automático de PDFs com busca de números de série
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Upload de Arquivos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload files={files} onFilesChange={handleFilesChange} />
            
            {files.length > 0 && !hasProcessed && (
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-hover"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processando..." : `Processar ${files.length} arquivo${files.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Status */}
        {processingFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status do Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessingStatus 
                files={processingFiles} 
                isProcessing={isProcessing} 
              />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {hasProcessed && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessingReport
                files={processingFiles}
                onDownloadZip={handleDownloadZip}
                onDownloadReport={handleDownloadReport}
              />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-accent/50 to-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Como funciona:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Faça upload dos arquivos PDF usando arrastar e soltar ou o botão de seleção</li>
              <li>O sistema <strong>automaticamente</strong> lê cada PDF e busca pelo número de série</li>
              <li>Procura pelo padrão: <code className="bg-muted px-1 rounded">1X000000X</code> (1 + letra + 6 dígitos + letra)</li>
              <li>Renomeia automaticamente os arquivos encontrados</li>
              <li>Gera relatório detalhado dos arquivos não processados e os motivos</li>
              <li>Baixe o arquivo ZIP com os PDFs renomeados e o relatório completo</li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
