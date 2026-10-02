import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickAddTaskModal } from '../tasks/QuickAddTaskModal';
import { ReminderNotificationBanner } from '../reminders/ReminderNotificationBanner';
import { SessionCompleteModal } from '../timer/SessionCompleteModal';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isQuickAddOpen, setIsQuickAddOpen, createTask, subjects, goals } = useApp();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content-area">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Global Actionable Reminder Banner */}
        <ReminderNotificationBanner />

        <main className="scrollable-body">
          {children}
        </main>
      </div>

      {/* Quick Add Task Modal */}
      <QuickAddTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={createTask}
        subjects={subjects}
        goals={goals}
      />

      {/* Global Focus Session Completion & Logging Modal */}
      <SessionCompleteModal />
    </div>
  );
};
