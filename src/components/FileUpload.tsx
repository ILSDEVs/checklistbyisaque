import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileWithId extends File {
  id: string;
  serialNumber?: string;
}

interface FileUploadProps {
  onFilesChange: (files: FileWithId[]) => void;
  files: FileWithId[];
}

export const FileUpload = ({ onFilesChange, files }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: `${file.name}-${Date.now()}-${Math.random()}`
    }));
    onFilesChange([...files, ...newFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const updateSerialNumber = (fileId: string, serialNumber: string) => {
    onFilesChange(files.map(file => 
      file.id === fileId ? { ...file, serialNumber } : file
    ));
  };

  const clearAll = () => {
    onFilesChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? "Solte os arquivos aqui" : "Arrastar e soltar PDFs"}
        </h3>
        <p className="text-muted-foreground mb-4">
          ou clique para selecionar arquivos
        </p>
        <Button variant="secondary" size="sm">
          Selecionar Arquivos
        </Button>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">
              Arquivos Selecionados ({files.length})
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="text-error hover:text-error hover:border-error"
            >
              Limpar Todos
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-4 bg-card border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-error" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-error"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Campo para inserir número de série */}
                <div className="space-y-2">
                  <Label htmlFor={`serial-${file.id}`} className="text-sm font-medium flex items-center space-x-2">
                    <Edit3 className="h-4 w-4" />
                    <span>Número de Série (1X000000X)</span>
                  </Label>
                  <Input
                    id={`serial-${file.id}`}
                    placeholder="Cole aqui o número de série (ex: 1A123456B)"
                    value={file.serialNumber || ''}
                    onChange={(e) => updateSerialNumber(file.id, e.target.value)}
                    className="font-mono"
                  />
                  {file.serialNumber && !/^1[A-Z][0-9]{6}[A-Z]$/.test(file.serialNumber) && (
                    <p className="text-xs text-error">
                      ⚠️ Formato inválido. Use o padrão: 1 + letra + 6 dígitos + letra
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};