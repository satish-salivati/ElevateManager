import React from 'react';
import Logo from './common/Logo';
import Button from './common/Button';
import Card from './common/Card';

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-slate-200 h-full">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-light text-brand-primary">
      {icon}
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-600 flex-grow">{children}</p>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="bg-white text-slate-700 antialiased">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-slate-800">
              <span className="text-slate-800">Elevate</span>
              <span className="text-brand-primary">Manager</span>
            </h1>
          </div>
          <div className="space-x-2">
            <Button onClick={onNavigateToAuth} variant="secondary" size="md">
              Login
            </Button>
             <Button onClick={onNavigateToAuth} size="md">
              Sign Up Free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="text-center py-20 lg:py-32 px-4 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Supercharge Your 1-on-1s with an AI Co-Pilot
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              ElevateManager transforms routine check-ins into powerful growth conversations. Get intelligent agendas, real-time coaching, and automated summaries to build a high-performing, engaged team.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={onNavigateToAuth} size="lg">
                Get Started for Free
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">No credit card required.</p>
          </div>
        </section>
        
        {/* Core Features Section */}
        <section className="py-20 lg:py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">An End-to-End Workflow for Better Management</h2>
                <p className="mt-4 text-lg text-slate-600">From prep to follow-up, we've got you covered.</p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Feature title="Intelligent Meeting Prep" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}>
                Never start from a blank page. Our AI generates tailored agendas based on goals, sentiment, and past conversations.
              </Feature>
              <Feature title="Real-Time AI Coaching" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2m4 0a2 2 0 012 2v2m-4-2a2 2 0 00-2 2v2m0 0a2 2 0 002 2m-2-2a2 2 0 01-2-2m2 2a2 2 0 002 2m2 4h.01" /></svg>}>
                Become a better manager in the moment. Get live prompts to ask more impactful questions and guide the conversation effectively.
              </Feature>
               <Feature title="AI-Powered Summaries" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                Instantly get structured summaries, key decisions, and a quantifiable Impact Score after every meeting.
              </Feature>
               <Feature title="Holistic Growth Planning" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}>
                Track career aspirations and get AI-generated suggestions for articles, skills, and projects to support employee growth.
              </Feature>
              <Feature title="Long-Term Trend Insights" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                Visualize sentiment and meeting impact over time with dashboards that help you spot trends for each employee.
              </Feature>
              <Feature title="Conversation Simulator" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}>
                Practice difficult conversations in a safe, AI-powered environment to build your confidence and skills.
              </Feature>
            </div>
          </div>
        </section>

        {/* Competitive Edge Section */}
        <section className="py-20 lg:py-24 px-4 bg-slate-50">
            <div className="max-w-5xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">What Makes ElevateManager Different?</h2>
                    <p className="mt-4 text-lg text-slate-600">Most tools treat 1-on-1s as just another task. We see them as your most powerful opportunity for growth.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <Card className="p-8">
                        <h3 className="text-lg font-bold text-slate-900">People-Focused, Not Project-Focused</h3>
                        <p className="mt-2 text-sm text-slate-600">While tools like Jira or Asana track tasks, we track sentiment, career growth, and conversational quality. We provide the human context essential for effective management.</p>
                    </Card>
                    <Card className="p-8 border-brand-primary ring-2 ring-brand-primary">
                        <h3 className="text-lg font-bold text-slate-900">An Intelligent Coach, Not Just a Notepad</h3>
                        <p className="mt-2 text-sm text-slate-600">Generic tools are a blank canvas. We are your co-pilot, actively helping you become a better manager with real-time guidance and unique training features like the Conversation Simulator.</p>
                    </Card>
                    <Card className="p-8">
                        <h3 className="text-lg font-bold text-slate-900">Intelligent Automation, Not Manual Work</h3>
                        <p className="mt-2 text-sm text-slate-600">We automate the tedious parts—prep, summarization, follow-up—and provide a consistent, best-practice framework so you can focus on the conversation, not the administration.</p>
                    </Card>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center py-20 lg:py-24 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Ready to Transform Your 1-on-1s?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Stop organizing meetings and start leading them. Actively make yourself a better manager and build a team that's engaged, motivated, and growing.
            </p>
            <div className="mt-8">
              <Button onClick={onNavigateToAuth} size="lg">
                Sign Up and Start Elevating Today
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ElevateManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
