import { ProcessingFile } from "./ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";

interface ProcessingReportProps {
  files: ProcessingFile[];
  onDownloadZip: () => void;
  onDownloadReport: () => void;
}

export const ProcessingReport = ({ files, onDownloadZip, onDownloadReport }: ProcessingReportProps) => {
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalCount = files.length;

  const handleDownloadZip = () => {
    onDownloadZip();
    toast.success("Download do ZIP iniciado!");
  };

  const handleDownloadReport = () => {
    onDownloadReport();
    toast.success("Relatório baixado com sucesso!");
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Processados</p>
                <p className="text-2xl font-bold text-success">{successCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-error" />
              <div>
                <p className="text-sm text-muted-foreground">Com Erro</p>
                <p className="text-2xl font-bold text-error">{errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleDownloadZip}
          disabled={successCount === 0}
          className="bg-gradient-to-r from-primary to-primary-hover"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar ZIP ({successCount} arquivos)
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleDownloadReport}
          size="lg"
        >
          <FileText className="h-4 w-4 mr-2" />
          Baixar Relatório
        </Button>
      </div>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  {file.status === 'success' && file.serialNumber && (
                    <p className="text-sm text-success">
                      Renomeado para: {file.serialNumber}.pdf
                    </p>
                  )}
                  {file.status === 'error' && file.errorReason && (
                    <p className="text-sm text-error">
                      Erro: {file.errorReason}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {file.status === 'success' ? (
                    <Badge variant="success">
                      Processado
                    </Badge>
                  ) : (
                    <Badge variant="error">
                      Erro
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};