import React from 'react';
import { NebulaProvider, useNebula } from './context/NebulaContext';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { AddressBar } from './components/Header/AddressBar';
import { SidebarNav } from './components/Sidebar/SidebarNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { CpfFunnelView } from './components/CPF/CpfFunnelView';
import { SystemsView } from './components/Systems/SystemsView';
import { RequirementsKanban } from './components/Kanban/RequirementsKanban';
import { HarvestsView } from './components/Harvests/HarvestsView';
import { OpenQuestionsView } from './components/Questions/OpenQuestionsView';
import { ExecutionPipelineView } from './components/Execution/ExecutionPipelineView';
import { AgentAuditView } from './components/Audit/AgentAuditView';
import { KnowledgeGraphView } from './components/Knowledge/KnowledgeGraphView';
import { OpRegistryView } from './components/OpRegistry/OpRegistryView';
import { PlansDocsView } from './components/PlansDocs/PlansDocsView';
import { MockConfigModal } from './components/Settings/MockConfigModal';
import { SearchModal } from './components/Common/SearchModal';

const AppContent: React.FC = () => {
  const { activeTab } = useNebula();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'cpf':
        return <CpfFunnelView />;
      case 'systems':
        return <SystemsView />;
      case 'kanban':
        return <RequirementsKanban />;
      case 'harvests':
        return <HarvestsView />;
      case 'questions':
        return <OpenQuestionsView />;
      case 'execution':
        return <ExecutionPipelineView />;
      case 'audit':
        return <AgentAuditView />;
      case 'knowledge':
        return <KnowledgeGraphView />;
      case 'opregistry':
        return <OpRegistryView />;
      case 'plansdocs':
        return <PlansDocsView />;
      case 'settings':
        return <MockConfigModal />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Top IDE Address Bar with Branding Box */}
      <AddressBar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNav />

        {/* Primary View Dashboard Area */}
        <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
          {renderActiveView()}
        </main>
      </div>

      {/* Global 13-Entity Search Modal */}
      <SearchModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <NebulaProvider>
        <AppContent />
      </NebulaProvider>
    </ErrorBoundary>
  );
}
