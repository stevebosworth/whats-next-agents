import React, { useState, useEffect } from 'react';
import { 
  Task, 
  parseTaskString, 
  HLC, 
  findFittingTasks, 
  isInQuietHours,
  User
} from '@packages/core';
import { TaskCard, Button, theme } from '@packages/ui';
import { Search, Clock, Plus, Zap, AlertCircle } from 'lucide-react';

const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'test@example.com',
  name: 'Steve',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: 'UTC',
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [availableTime, setAvailableTime] = useState<number | null>(null);
  const [hlc] = useState(new HLC('web-client'));
  const [error, setError] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse tasks', e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (!inputText.trim()) return;

    try {
      const parsed = parseTaskString(inputText, MOCK_USER.timezone);
      const now = new Date().toISOString();
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: parsed.title,
        duration_minutes: parsed.duration_minutes,
        due_at: parsed.due_at,
        timezone: parsed.timezone,
        task_type: 'admin', // default
        is_completed: false,
        tags: [],
        hlc_timestamp: hlc.tick(),
        created_at: now,
        updated_at: now,
        timezone_mode: 'floating',
      };

      setTasks([newTask, ...tasks]);
      setInputText('');
      setError(null);
    } catch (err) {
      setError('Failed to parse task string');
    }
  };

  const fittingTasks = availableTime !== null 
    ? findFittingTasks(tasks, availableTime) 
    : tasks.filter(t => !t.is_completed && !t.deleted_at);

  const isQuiet = isInQuietHours(MOCK_USER);

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen bg-white shadow-sm border-x">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">What's Next?</h1>
          <p className="text-gray-500">Hi, {MOCK_USER.name}.</p>
        </div>
        {isQuiet && (
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
            <Clock size={16} /> Quiet Hours
          </div>
        )}
      </header>

      {/* Quick Input */}
      <div className="relative mb-8 group">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder='e.g., "Prepare presentation (45m) tomorrow at 9am"'
          className="w-full text-xl p-4 pr-24 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all duration-200"
        />
        <div className="absolute right-2 top-2">
          <Button 
            title="Add" 
            onPress={handleAddTask} 
            disabled={!inputText.trim()}
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>

      {/* Time Fitting Controls */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 whitespace-nowrap">
          <Zap size={16} className="text-yellow-500" /> I have
        </div>
        {[15, 30, 45, 60, 90].map(mins => (
          <button
            key={mins}
            onClick={() => setAvailableTime(availableTime === mins ? null : mins)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              availableTime === mins 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-2px]' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {availableTime !== null && (
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-2">
            Top {fittingTasks.length} suggestions for your {availableTime}m gap
          </h2>
        )}
        
        {fittingTasks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-400 font-medium">No tasks found matching your criteria.</p>
          </div>
        ) : (
          fittingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
};

export default App;
