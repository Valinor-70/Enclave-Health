import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile, db, dbHelpers, ProgressEntry, WorkoutLog } from '../db/db';

interface GraphsProps {
  user: UserProfile;
}

const Graphs: React.FC<GraphsProps> = ({ user }) => {
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | '3months' | '6months'>('month');

  useEffect(() => {
    loadGraphData();
  }, [user, selectedTimeRange]);

  const loadGraphData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Set start date based on selected range
      switch (selectedTimeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
      }

      const [progress, workouts] = await Promise.all([
        dbHelpers.getProgressEntries(user.id!, startDate, endDate),
        dbHelpers.getWorkoutLogs(user.id!, startDate, endDate)
      ]);

      // Generate sample data if no real data exists
      if (progress.length === 0) {
        await generateSampleData(startDate, endDate);
        const newProgress = await dbHelpers.getProgressEntries(user.id!, startDate, endDate);
        setProgressData(newProgress);
      } else {
        setProgressData(progress);
      }

      setWorkoutData(workouts);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = async (startDate: Date, endDate: Date) => {
    const entries: ProgressEntry[] = [];
    const currentDate = new Date(startDate);
    let currentWeight = user.weight;

    while (currentDate <= endDate) {
      // Simulate weight progression based on fitness goal
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (user.fitnessAim === 'lose_fat') {
        currentWeight = user.weight - (daysDiff * 0.1); // Gradual weight loss
      } else if (user.fitnessAim === 'gain_muscle') {
        currentWeight = user.weight + (daysDiff * 0.05); // Gradual weight gain
      } else {
        currentWeight = user.weight + (Math.random() - 0.5) * 0.5; // Small fluctuations
      }

      entries.push({
        userId: user.id!,
        date: new Date(currentDate),
        weight: Math.round(currentWeight * 10) / 10,
        createdAt: new Date(currentDate)
      });

      currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 3) + 1);
    }

    // Add entries to database
    for (const entry of entries) {
      await db.progressEntries.add(entry);
    }
  };

  const getTimeRangeLabel = () => {
    switch (selectedTimeRange) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case '3months': return 'Last 3 Months';
      case '6months': return 'Last 6 Months';
    }
  };

  const formatChartData = (data: ProgressEntry[]) => {
    return data.map(entry => ({
      date: entry.date.toLocaleDateString(),
      weight: entry.weight,
      timestamp: entry.date.getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  };

  const generateStrengthData = () => {
    // Sample strength progression data
    const exercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press'];
    return exercises.map(exercise => {
      let baseWeight = 0;
      
      switch (exercise) {
        case 'Bench Press':
          baseWeight = user.benchPress || user.weight * 0.8;
          break;
        case 'Squat':
          baseWeight = user.squat || user.weight * 1.2;
          break;
        case 'Deadlift':
          baseWeight = user.deadlift || user.weight * 1.5;
          break;
        case 'Overhead Press':
          baseWeight = user.overheadPress || user.weight * 0.6;
          break;
      }

      return {
        exercise,
        current: Math.round(baseWeight),
        previous: Math.round(baseWeight * 0.9),
        target: Math.round(baseWeight * 1.1)
      };
    });
  };

  const generateCalorieData = () => {
    // Sample calorie intake data
    const days = [];
    const currentDate = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      const targetCalories = 2200; // Sample target
      const actualCalories = targetCalories + (Math.random() - 0.5) * 400;
      
      days.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        target: targetCalories,
        actual: Math.round(actualCalories),
        date: date.toLocaleDateString()
      });
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="graphs-loading">
        <div className="loading-spinner"></div>
        <p>Loading progress charts...</p>
      </div>
    );
  }

  const weightData = formatChartData(progressData);
  const strengthData = generateStrengthData();
  const calorieData = generateCalorieData();

  return (
    <div className="graphs">
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Progress Analytics</h1>
        <p>Track your fitness journey with detailed insights</p>
      </motion.div>

      {/* Time Range Selector */}
      <motion.div 
        className="time-range-selector"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="selector-label">Time Range:</div>
        <div className="selector-buttons">
          {(['week', 'month', '3months', '6months'] as const).map(range => (
            <button
              key={range}
              className={`range-btn ${selectedTimeRange === range ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === 'week' ? '7D' : range === 'month' ? '1M' : range === '3months' ? '3M' : '6M'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Weight Progress Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Weight Progress</h3>
            <div className="chart-subtitle">{getTimeRangeLabel()}</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00b4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 32, 0.9)',
                    border: '1px solid rgba(0, 180, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#00b4ff"
                  strokeWidth={3}
                  fill="url(#weightGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Strength Progress Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Strength Progress</h3>
            <div className="chart-subtitle">Current vs Previous (kg)</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strengthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="exercise" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 32, 0.9)',
                    border: '1px solid rgba(0, 180, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="previous" fill="rgba(255, 255, 255, 0.3)" name="Previous" />
                <Bar dataKey="current" fill="#00b4ff" name="Current" />
                <Bar dataKey="target" fill="rgba(255, 138, 0, 0.7)" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Calorie Tracking Chart */}
        <motion.div 
          className="chart-card full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="chart-header">
            <h3>Calorie Intake vs Target</h3>
            <div className="chart-subtitle">Last 7 Days</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={calorieData}>
                <defs>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff8a00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00b4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 32, 0.9)',
                    border: '1px solid rgba(0, 180, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stackId="1"
                  stroke="#ff8a00"
                  strokeWidth={2}
                  fill="url(#targetGradient)"
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stackId="2"
                  stroke="#00b4ff"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div 
          className="stats-summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3>Progress Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Weight Change</div>
              <div className="summary-value">
                {weightData.length >= 2 ? 
                  `${((weightData[weightData.length - 1]?.weight || 0) - (weightData[0]?.weight || 0)).toFixed(1)} kg` : 
                  'N/A'
                }
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Workouts</div>
              <div className="summary-value">{workoutData.filter(w => w.completed).length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Avg Calories</div>
              <div className="summary-value">
                {Math.round(calorieData.reduce((sum, day) => sum + day.actual, 0) / calorieData.length)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Consistency</div>
              <div className="summary-value">
                {Math.round((workoutData.filter(w => w.completed).length / Math.max(workoutData.length, 1)) * 100)}%
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .graphs {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .graphs-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 180, 255, 0.3);
          border-top: 3px solid #00b4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .header-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .header-section h1 {
          font-family: 'Orbitron', monospace;
          font-size: 36px;
          color: #00b4ff;
          margin: 0 0 8px 0;
          text-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
        }

        .header-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .time-range-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
          padding: 20px;
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .selector-label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .selector-buttons {
          display: flex;
          gap: 8px;
        }

        .range-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 14px;
        }

        .range-btn:hover {
          background: rgba(0, 180, 255, 0.2);
          border-color: #00b4ff;
          color: #00b4ff;
        }

        .range-btn.active {
          background: #00b4ff;
          color: #ffffff;
          border-color: #00b4ff;
          box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 24px;
        }

        .chart-card {
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-header {
          margin-bottom: 20px;
        }

        .chart-header h3 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 20px;
          margin: 0 0 4px 0;
        }

        .chart-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .chart-container {
          position: relative;
        }

        .stats-summary {
          grid-column: 1 / -1;
          background: rgba(15, 23, 32, 0.8);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .stats-summary h3 {
          font-family: 'Orbitron', monospace;
          color: #00b4ff;
          font-size: 20px;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .summary-item {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(0, 180, 255, 0.2);
        }

        .summary-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          color: #00b4ff;
          font-size: 24px;
          font-weight: 700;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .graphs {
            padding: 0 15px;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .time-range-selector {
            flex-direction: column;
            gap: 12px;
          }

          .header-section h1 {
            font-size: 28px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Graphs;