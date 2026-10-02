import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { TimerProvider } from './context/TimerContext';
import { Layout } from './components/layout/Layout';
import { TodayView } from './views/TodayView';
import { ScheduleView } from './views/ScheduleView';
import { GoalsView } from './views/GoalsView';
import { HabitsView } from './views/HabitsView';
import { ProgressView } from './views/ProgressView';
import { StudyView } from './views/StudyView';
import { NotesView } from './views/NotesView';
import { FilesView } from './views/FilesView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';

const MainViewRenderer: React.FC = () => {
  const { currentView } = useApp();

  switch (currentView) {
    case 'today':
      return <TodayView />;
    case 'schedule':
      return <ScheduleView />;
    case 'goals':
      return <GoalsView />;
    case 'habits':
      return <HabitsView />;
    case 'progress':
      return <ProgressView />;
    case 'study':
      return <StudyView />;
    case 'notes':
      return <NotesView />;
    case 'files':
      return <FilesView />;
    case 'ai':
      return <AIAssistantView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <TodayView />;
  }
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <TimerProvider>
          <Layout>
            <MainViewRenderer />
          </Layout>
        </TimerProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
