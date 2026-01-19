import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressTracker = ({ 
  currentStep = 1, 
  totalSteps = 4, 
  steps = [],
  processingStatus = null 
}) => {
  const defaultSteps = [
    { id: 1, title: 'Parameters', description: 'Configure report settings' },
    { id: 2, title: 'Calculations', description: 'Process financial data' },
    { id: 3, title: 'Preview', description: 'Review generated report' },
    { id: 4, title: 'Export', description: 'Download final report' }
  ];

  const stepList = steps?.length > 0 ? steps : defaultSteps;

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepId, status) => {
    if (status === 'completed') return 'CheckCircle';
    if (status === 'active' && processingStatus === 'processing') return 'Loader';
    if (status === 'active') return 'Circle';
    return 'Circle';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'active': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getConnectorColor = (stepId) => {
    return stepId < currentStep ? 'bg-success' : 'bg-border';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Report Generation Progress</h3>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps} • {Math.round((currentStep / totalSteps) * 100)}% Complete
          </p>
        </div>
        
        {processingStatus && (
          <div className="flex items-center space-x-2">
            {processingStatus === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-primary font-medium">Processing...</span>
              </>
            )}
            {processingStatus === 'completed' && (
              <>
                <Icon name="CheckCircle" size={16} className="text-success" />
                <span className="text-sm text-success font-medium">Completed</span>
              </>
            )}
            {processingStatus === 'error' && (
              <>
                <Icon name="AlertCircle" size={16} className="text-error" />
                <span className="text-sm text-error font-medium">Error</span>
              </>
            )}
          </div>
        )}
      </div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      {/* Step List */}
      <div className="space-y-4">
        {stepList?.map((step, index) => {
          const status = getStepStatus(step?.id);
          const isLast = index === stepList?.length - 1;
          
          return (
            <div key={step?.id} className="relative">
              <div className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  status === 'completed' 
                    ? 'bg-success border-success' 
                    : status === 'active' ?'bg-primary/10 border-primary' :'bg-background border-border'
                }`}>
                  <Icon 
                    name={getStepIcon(step?.id, status)} 
                    size={16} 
                    className={`${getStepColor(status)} ${
                      status === 'active' && processingStatus === 'processing' ? 'animate-spin' : ''
                    }`}
                  />
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      status === 'active' ? 'text-foreground' : 
                      status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step?.title}
                    </h4>
                    
                    {status === 'completed' && (
                      <span className="text-xs text-success font-medium">✓ Complete</span>
                    )}
                    {status === 'active' && processingStatus === 'processing' && (
                      <span className="text-xs text-primary font-medium">In Progress</span>
                    )}
                  </div>
                  
                  <p className={`text-xs mt-1 ${
                    status === 'active' ? 'text-muted-foreground' : 
                    status === 'completed' ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  }`}>
                    {step?.description}
                  </p>

                  {/* Additional step details for active step */}
                  {status === 'active' && step?.details && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {step?.details}
                    </div>
                  )}
                </div>
              </div>
              {/* Connector Line */}
              {!isLast && (
                <div className={`absolute left-5 top-10 w-0.5 h-6 ${getConnectorColor(step?.id)} transition-colors duration-200`}></div>
              )}
            </div>
          );
        })}
      </div>
      {/* Processing Details */}
      {processingStatus === 'processing' && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <div>
              <p className="text-sm font-medium text-primary">Processing calculations...</p>
              <p className="text-xs text-muted-foreground">
                This may take a few moments for large datasets
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Error State */}
      {processingStatus === 'error' && (
        <div className="mt-6 p-4 bg-error/5 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <Icon name="AlertCircle" size={20} className="text-error" />
            <div>
              <p className="text-sm font-medium text-error">Processing failed</p>
              <p className="text-xs text-muted-foreground">
                Please check your parameters and try again
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Success State */}
      {processingStatus === 'completed' && currentStep === totalSteps && (
        <div className="mt-6 p-4 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <Icon name="CheckCircle" size={20} className="text-success" />
            <div>
              <p className="text-sm font-medium text-success">Report generated successfully!</p>
              <p className="text-xs text-muted-foreground">
                Your financial report is ready for export
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;