import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile, db, dbHelpers, ProgressEntry, WorkoutLog } from '../db/db';
import { EnclaveCard, EnclaveButton } from './EnclaveUI';

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
      {/* Enhanced Header with HUD styling */}
      <motion.div 
        className="analytics-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <h1>Progress Analytics</h1>
          <p>Track your fitness journey with detailed insights</p>
          <div className="scan-lines"></div>
        </div>
      </motion.div>

      {/* Enhanced Time Range Selector */}
      <motion.div 
        className="time-range-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <EnclaveCard variant="primary" glowing={true}>
          <div className="range-selector-content">
            <div className="selector-label">
              <span className="label-text">Temporal Range:</span>
              <div className="label-indicator"></div>
            </div>
            <div className="selector-buttons">
              {(['week', 'month', '3months', '6months'] as const).map(range => (
                <EnclaveButton
                  key={range}
                  variant={selectedTimeRange === range ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                  plasma={selectedTimeRange === range}
                >
                  {range === 'week' ? '7D' : range === 'month' ? '1M' : range === '3months' ? '3M' : '6M'}
                </EnclaveButton>
              ))}
            </div>
          </div>
        </EnclaveCard>
      </motion.div>

      {/* Enhanced Charts Grid */}
      <div className="charts-grid">
        {/* Weight Progress Chart with HUD styling */}
        <motion.div 
          className="chart-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <EnclaveCard variant="primary" glowing={true}>
            <div className="chart-header">
              <div className="chart-title">
                <h3>Weight Progress</h3>
                <div className="chart-status">MONITORING</div>
              </div>
              <div className="chart-subtitle">{getTimeRangeLabel()}</div>
            </div>
            <div className="chart-container">
              <div className="chart-grid-overlay"></div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--enclave-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--enclave-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="rgba(0, 180, 255, 0.2)" 
                    className="chart-grid"
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--enclave-text-secondary)"
                    fontSize={11}
                    fontFamily="var(--font-heading)"
                  />
                  <YAxis 
                    stroke="var(--enclave-text-secondary)"
                    fontSize={11}
                    fontFamily="var(--font-heading)"
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="hud-tooltip">
                            <div className="tooltip-header">Weight Scan</div>
                            <div className="tooltip-data">
                              <span className="tooltip-label">Date:</span>
                              <span className="tooltip-value">{label}</span>
                            </div>
                            <div className="tooltip-data">
                              <span className="tooltip-label">Weight:</span>
                              <span className="tooltip-value">{payload[0].value} kg</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--enclave-primary)"
                    strokeWidth={3}
                    fill="url(#weightGradient)"
                    filter="url(#glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </EnclaveCard>
        </motion.div>

        {/* Strength Progress Chart with HUD styling */}
        <motion.div 
          className="chart-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <EnclaveCard variant="primary" glowing={true}>
            <div className="chart-header">
              <div className="chart-title">
                <h3>Strength Progress</h3>
                <div className="chart-status">ANALYZING</div>
              </div>
              <div className="chart-subtitle">Current vs Previous (kg)</div>
            </div>
            <div className="chart-container">
              <div className="chart-grid-overlay"></div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strengthData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="rgba(0, 180, 255, 0.2)"
                    className="chart-grid"
                  />
                  <XAxis 
                    dataKey="exercise" 
                    stroke="var(--enclave-text-secondary)"
                    fontSize={10}
                    fontFamily="var(--font-heading)"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="var(--enclave-text-secondary)" 
                    fontSize={11}
                    fontFamily="var(--font-heading)"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="hud-tooltip">
                            <div className="tooltip-header">Strength Analysis</div>
                            <div className="tooltip-data">
                              <span className="tooltip-label">Exercise:</span>
                              <span className="tooltip-value">{label}</span>
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} className="tooltip-data">
                                <span className="tooltip-label">{entry.name}:</span>
                                <span className="tooltip-value">{entry.value} kg</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="previous" 
                    fill="var(--enclave-text-dim)" 
                    name="Previous"
                    filter="url(#barGlow)"
                  />
                  <Bar 
                    dataKey="current" 
                    fill="var(--enclave-primary)" 
                    name="Current"
                    filter="url(#barGlow)"
                  />
                  <Bar 
                    dataKey="target" 
                    fill="var(--enclave-accent)" 
                    name="Target"
                    filter="url(#barGlow)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </EnclaveCard>
        </motion.div>

        {/* Calorie Tracking Chart with HUD styling */}
        <motion.div 
          className="chart-section full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <EnclaveCard variant="primary" glowing={true}>
            <div className="chart-header">
              <div className="chart-title">
                <h3>Calorie Intake vs Target</h3>
                <div className="chart-status">TRACKING</div>
              </div>
              <div className="chart-subtitle">Last 7 Days</div>
            </div>
            <div className="chart-container">
              <div className="chart-grid-overlay"></div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={calorieData}>
                  <defs>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--enclave-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--enclave-accent)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--enclave-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--enclave-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="rgba(0, 180, 255, 0.2)"
                    className="chart-grid"
                  />
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--enclave-text-secondary)" 
                    fontSize={11}
                    fontFamily="var(--font-heading)"
                  />
                  <YAxis 
                    stroke="var(--enclave-text-secondary)" 
                    fontSize={11}
                    fontFamily="var(--font-heading)"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="hud-tooltip">
                            <div className="tooltip-header">Calorie Analysis</div>
                            <div className="tooltip-data">
                              <span className="tooltip-label">Day:</span>
                              <span className="tooltip-value">{label}</span>
                            </div>
                            {payload.map((entry, index) => (
                              <div key={index} className="tooltip-data">
                                <span className="tooltip-label">{entry.name}:</span>
                                <span className="tooltip-value">{entry.value} kcal</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stackId="1"
                    stroke="var(--enclave-accent)"
                    strokeWidth={2}
                    fill="url(#targetGradient)"
                    name="Target"
                    filter="url(#glow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stackId="2"
                    stroke="var(--enclave-primary)"
                    strokeWidth={2}
                    fill="url(#actualGradient)"
                    name="Actual"
                    filter="url(#glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </EnclaveCard>
        </motion.div>

        {/* Enhanced Stats Summary */}
        <motion.div 
          className="stats-summary full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <EnclaveCard variant="primary" glowing={true}>
            <div className="summary-header">
              <h3>Progress Summary</h3>
              <div className="summary-status">COMPILED</div>
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M16 2L14 8h-4l6 6v16l6-6h4L16 2z"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label">Weight Change</div>
                  <div className="summary-value">
                    {weightData.length >= 2 ? 
                      `${((weightData[weightData.length - 1]?.weight || 0) - (weightData[0]?.weight || 0)).toFixed(1)} kg` : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M8 4v24l8-8 8 8V4H8z"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label">Workouts</div>
                  <div className="summary-value">{workoutData.filter(w => w.completed).length}</div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                    <circle cx="16" cy="16" r="12" strokeWidth="2" stroke="currentColor" fill="none"/>
                    <path d="M16 8v8l4 4"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label">Avg Calories</div>
                  <div className="summary-value">
                    {Math.round(calorieData.reduce((sum, day) => sum + day.actual, 0) / calorieData.length)}
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M16 2L6 12l10 10 10-10L16 2zm0 4l6 6-6 6-6-6 6-6z"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label">Consistency</div>
                  <div className="summary-value">
                    {Math.round((workoutData.filter(w => w.completed).length / Math.max(workoutData.length, 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </EnclaveCard>
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
          color: var(--enclave-text-secondary);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--enclave-border);
          border-top: 3px solid var(--enclave-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
          box-shadow: var(--enclave-shadow-glow);
        }

        /* Enhanced Analytics Header */
        .analytics-header {
          margin-bottom: 40px;
          position: relative;
        }

        .header-content {
          text-align: center;
          padding: 40px 32px;
          background: var(--enclave-bg-secondary);
          border: 2px solid var(--enclave-border);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .header-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(135deg, transparent 0%, var(--enclave-primary-dim) 30%, transparent 70%),
            radial-gradient(circle at 20% 80%, rgba(0, 180, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .header-content h1 {
          font-family: var(--font-display);
          font-size: 48px;
          color: var(--enclave-primary);
          margin: 0 0 16px 0;
          text-shadow: 0 0 30px var(--enclave-primary-glow);
          text-transform: uppercase;
          letter-spacing: 4px;
          position: relative;
          z-index: 1;
        }

        .header-content p {
          color: var(--enclave-text-secondary);
          font-size: 18px;
          margin: 0;
          font-family: var(--font-body);
          position: relative;
          z-index: 1;
        }

        .scan-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 180, 255, 0.03) 2px,
            rgba(0, 180, 255, 0.03) 4px
          );
          pointer-events: none;
          animation: scanlines 4s linear infinite;
        }

        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(8px); }
        }

        /* Enhanced Time Range Selector */
        .time-range-section {
          margin-bottom: 40px;
        }

        .range-selector-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          gap: 24px;
        }

        .selector-label {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .label-text {
          color: var(--enclave-text-primary);
          font-weight: 600;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .label-indicator {
          width: 12px;
          height: 12px;
          background: var(--enclave-primary);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 10px var(--enclave-primary-glow);
        }

        .selector-buttons {
          display: flex;
          gap: 12px;
        }

        /* Enhanced Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 32px;
        }

        .chart-section {
          position: relative;
        }

        .chart-section.full-width {
          grid-column: 1 / -1;
        }

        .chart-header {
          margin-bottom: 24px;
          position: relative;
        }

        .chart-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .chart-title h3 {
          font-family: var(--font-display);
          color: var(--enclave-primary);
          font-size: 24px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 15px var(--enclave-primary-glow);
        }

        .chart-status {
          padding: 4px 12px;
          background: var(--enclave-primary-glow);
          color: var(--enclave-primary);
          border: 1px solid var(--enclave-primary);
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          animation: pulse 3s ease-in-out infinite;
        }

        .chart-subtitle {
          color: var(--enclave-text-secondary);
          font-size: 14px;
          font-family: var(--font-body);
        }

        .chart-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(11, 15, 20, 0.5);
          border: 1px solid var(--enclave-border);
        }

        .chart-grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(90deg, transparent 98%, rgba(0, 180, 255, 0.1) 100%),
            linear-gradient(0deg, transparent 98%, rgba(0, 180, 255, 0.1) 100%);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 1;
        }

        /* HUD Tooltip Styling */
        .hud-tooltip {
          background: var(--enclave-bg-secondary);
          border: 2px solid var(--enclave-primary);
          border-radius: 8px;
          padding: 16px;
          box-shadow: var(--enclave-shadow-glow);
          position: relative;
          overflow: hidden;
        }

        .hud-tooltip::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, var(--enclave-primary-dim) 50%, transparent 100%);
          pointer-events: none;
        }

        .tooltip-header {
          color: var(--enclave-primary);
          font-family: var(--font-heading);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

        .tooltip-data {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .tooltip-data:last-child {
          margin-bottom: 0;
        }

        .tooltip-label {
          color: var(--enclave-text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
        }

        .tooltip-value {
          color: var(--enclave-text-primary);
          font-family: var(--font-heading);
          font-weight: 600;
          text-shadow: 0 0 8px var(--enclave-primary-glow);
        }

        /* Enhanced Chart Grid Effects */
        .chart-grid {
          stroke: rgba(0, 180, 255, 0.2);
          stroke-dasharray: 2 2;
          animation: grid-pulse 4s ease-in-out infinite;
        }

        @keyframes grid-pulse {
          0%, 100% { stroke-opacity: 0.2; }
          50% { stroke-opacity: 0.4; }
        }

        /* Enhanced Stats Summary */
        .stats-summary {
          grid-column: 1 / -1;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--enclave-border);
        }

        .summary-header h3 {
          font-family: var(--font-display);
          color: var(--enclave-primary);
          font-size: 28px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 15px var(--enclave-primary-glow);
        }

        .summary-status {
          padding: 6px 16px;
          background: var(--enclave-text-success);
          color: var(--enclave-bg-primary);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          font-family: var(--font-heading);
          text-transform: uppercase;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: var(--enclave-bg-tertiary);
          border: 2px solid var(--enclave-border);
          border-radius: 12px;
          transition: var(--enclave-transition);
          position: relative;
          overflow: hidden;
        }

        .summary-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent 0%, var(--enclave-primary-dim) 50%, transparent 100%);
          opacity: 0;
          transition: var(--enclave-transition);
        }

        .summary-item:hover {
          border-color: var(--enclave-primary);
          box-shadow: var(--enclave-shadow-glow);
          transform: translateY(-2px);
        }

        .summary-item:hover::before {
          opacity: 1;
        }

        .summary-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--enclave-bg-secondary);
          border: 2px solid var(--enclave-primary);
          border-radius: 12px;
          color: var(--enclave-primary);
          position: relative;
          z-index: 1;
        }

        .summary-content {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .summary-label {
          color: var(--enclave-text-secondary);
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-heading);
          font-weight: 500;
        }

        .summary-value {
          color: var(--enclave-primary);
          font-size: 28px;
          font-weight: 700;
          font-family: var(--font-heading);
          text-shadow: 0 0 15px var(--enclave-primary-glow);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .graphs {
            padding: 0 15px;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .range-selector-content {
            flex-direction: column;
            gap: 16px;
          }

          .header-content h1 {
            font-size: 36px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .summary-item {
            gap: 16px;
            padding: 20px;
          }

          .summary-icon {
            width: 48px;
            height: 48px;
          }

          .summary-value {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          
          .selector-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Graphs;