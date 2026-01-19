import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DocumentsTab = ({ documents, onDocumentUpload, onDocumentUpdate, onDocumentDelete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: 'license',
    description: '',
    expiryDate: ''
  });

  const documentCategories = [
    { value: 'all', label: 'All Documents' },
    { value: 'license', label: 'License' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'registration', label: 'Registration' },
    { value: 'contract', label: 'Contract' },
    { value: 'financial', label: 'Financial' },
    { value: 'other', label: 'Other' }
  ];

  const filteredDocuments = documents?.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc?.category === selectedCategory;
    const matchesSearch = doc?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         doc?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === 'dragenter' || e?.type === 'dragover') {
      setDragActive(true);
    } else if (e?.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);
    
    if (e?.dataTransfer?.files && e?.dataTransfer?.files?.[0]) {
      handleFileUpload(e?.dataTransfer?.files?.[0]);
    }
  };

  const handleFileUpload = (file) => {
    const document = {
      id: `DOC${String(documents?.length + 1)?.padStart(3, '0')}`,
      name: file?.name,
      category: uploadData?.category,
      description: uploadData?.description || file?.name,
      size: file?.size,
      type: file?.type,
      uploadDate: new Date()?.toISOString()?.split('T')?.[0],
      expiryDate: uploadData?.expiryDate,
      status: 'pending',
      version: 1,
      url: URL.createObjectURL(file)
    };
    
    onDocumentUpload(document);
    setUploadData({
      category: 'license',
      description: '',
      expiryDate: ''
    });
    setShowUploadForm(false);
  };

  const handleFileInput = (e) => {
    if (e?.target?.files && e?.target?.files?.[0]) {
      handleFileUpload(e?.target?.files?.[0]);
    }
  };

  const getDocumentIcon = (type) => {
    if (type?.includes('pdf')) return 'FileText';
    if (type?.includes('image')) return 'Image';
    if (type?.includes('word')) return 'FileText';
    if (type?.includes('excel')) return 'FileSpreadsheet';
    return 'File';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-error text-error-foreground';
      case 'expired': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e?.target?.value)}
            className="px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {documentCategories?.map(category => (
              <option key={category?.value} value={category?.value}>
                {category?.label}
              </option>
            ))}
          </select>
          
          <Button
            variant="default"
            onClick={() => setShowUploadForm(true)}
            iconName="Upload"
            iconPosition="left"
            iconSize={16}
          >
            Upload Document
          </Button>
        </div>
      </div>
      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Upload New Document</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUploadForm(false)}
              iconName="X"
              iconSize={16}
            >
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <select
                value={uploadData?.category}
                onChange={(e) => setUploadData(prev => ({ ...prev, category: e?.target?.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {documentCategories?.slice(1)?.map(category => (
                  <option key={category?.value} value={category?.value}>
                    {category?.label}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Description"
              type="text"
              value={uploadData?.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e?.target?.value }))}
              placeholder="Document description"
            />
            
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={uploadData?.expiryDate}
              onChange={(e) => setUploadData(prev => ({ ...prev, expiryDate: e?.target?.value }))}
            />
          </div>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Icon name="Upload" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">Drop files here or click to upload</h4>
            <p className="text-muted-foreground mb-4">Supports PDF, DOC, DOCX, JPG, PNG files up to 10MB</p>
            
            <input
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>
        </div>
      )}
      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocuments?.map((document) => (
          <div key={document?.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Icon name={getDocumentIcon(document?.type)} size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-card-foreground truncate">{document?.name}</h4>
                  <p className="text-sm text-muted-foreground">{document?.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document?.status)}`}>
                  {document?.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  iconName="MoreVertical"
                  iconSize={14}
                >
                  <span className="sr-only">More options</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{formatFileSize(document?.size)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="font-medium">{document?.uploadDate}</span>
              </div>
              
              {document?.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className={`font-medium ${
                    isExpired(document?.expiryDate) ? 'text-error' :
                    isExpiringSoon(document?.expiryDate) ? 'text-warning' : ''
                  }`}>
                    {document?.expiryDate}
                    {isExpired(document?.expiryDate) && ' (Expired)'}
                    {isExpiringSoon(document?.expiryDate) && !isExpired(document?.expiryDate) && ' (Expiring Soon)'}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-medium">v{document?.version}</span>
              </div>
            </div>

            {document?.description && (
              <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted rounded">
                {document?.description}
              </p>
            )}

            <div className="flex space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                iconName="Eye"
                iconPosition="left"
                iconSize={14}
              >
                View
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                fullWidth
                iconName="Download"
                iconPosition="left"
                iconSize={14}
              >
                Download
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDocumentDelete(document?.id)}
                iconName="Trash2"
                iconSize={14}
              >
                <span className="sr-only">Delete document</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {filteredDocuments?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' ?'Try adjusting your search or filter criteria.' :'Upload the first document for this TVP owner.'}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button
              variant="default"
              onClick={() => setShowUploadForm(true)}
              iconName="Upload"
              iconPosition="left"
              iconSize={16}
            >
              Upload First Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;