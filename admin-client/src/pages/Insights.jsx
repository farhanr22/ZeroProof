import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Button, Paper, Box, Divider, Skeleton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { insightsAPI } from '../api/Client.js';

// Custom component to mimic the Tally.so percentage bar
const TallyProgressBar = ({ label, percentage, count }) => (
  <Box sx={{ 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    mb: 1.5, position: 'relative', overflow: 'hidden',
    border: '1px solid #E2E8F0', borderRadius: 2,
    bgcolor: '#ffffff'
  }}>
    <Box sx={{ 
      position: 'absolute', top: 0, left: 0, bottom: 0, 
      width: `${percentage}%`, bgcolor: '#F1F5F9', zIndex: 0 
    }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', p: 1.5, zIndex: 1 }}>
      <Typography variant="body1" sx={{ color: '#334155' }}>{label}</Typography>
      <Box display="flex" gap={3} alignItems="center">
        <Typography variant="body2" sx={{ color: '#64748B', minWidth: '30px', textAlign: 'right' }}>
          {percentage}%
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8', minWidth: '80px', textAlign: 'right' }}>
          {count} response{count !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  </Box>
);

export default function Insights() {
  const { id } = useParams();
  // Backend returns a flat array of question insight objects
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInsights();
  }, [id]);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insightsAPI.get(id);
      // Backend shape: data.insights is an array of question insight objects
      // Each has: _id, text, type, total_answers, and type-specific fields (counts, sum, average, distribution, texts)
      setQuestions(Array.isArray(data.insights) ? data.insights : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute total responses from max total_answers across questions
  const totalResponses = questions.reduce((max, q) => Math.max(max, q.total_answers || 0), 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button component={Link} to={`/campaigns/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Overview
      </Button>

      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">Analytics & Insights</Typography>
        <Typography color="text.secondary">
          {!isLoading ? `Based on ${totalResponses} total responses` : 'Loading...'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" flexDirection="column" gap={3}>
          {[1, 2, 3].map(i => (
            <Box key={i}>
              <Skeleton variant="text" width={300} height={30} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} />
            </Box>
          ))}
        </Box>
      ) : questions.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <Typography color="text.secondary">No data to analyze yet.</Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          {questions.map((q, index) => {
            // Choice questions — show bar charts
            if (q.type === 'single_choice' || q.type === 'multi_choice') {
              // Backend returns counts as { "Option A": 5, "Option B": 3 }
              const totalForQ = q.total_answers || 1;
              const stats = Object.entries(q.counts || {})
                .map(([option, count]) => ({
                  option,
                  count,
                  percentage: Math.round((count / totalForQ) * 100),
                }))
                .sort((a, b) => b.count - a.count);

              return (
                <Box key={q._id}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>
                    {index + 1}. {q.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {q.total_answers} responses
                  </Typography>
                  
                  {stats.map((stat, i) => (
                    <TallyProgressBar 
                      key={i} 
                      label={stat.option} 
                      percentage={stat.percentage} 
                      count={stat.count} 
                    />
                  ))}
                  <Divider sx={{ mt: 4 }} />
                </Box>
              );
            }

            // Rating questions — show average + distribution
            if (q.type === 'rating') {
              const totalForQ = q.total_answers || 1;
              const distEntries = Object.entries(q.distribution || {})
                .map(([value, count]) => ({
                  value: Number(value),
                  count,
                  percentage: Math.round((count / totalForQ) * 100),
                }))
                .sort((a, b) => a.value - b.value);

              return (
                <Box key={q._id}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>
                    {index + 1}. {q.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {q.total_answers} responses · Average: <strong>{q.average?.toFixed(1) || 'N/A'}</strong>
                  </Typography>
                  
                  {distEntries.map((d, i) => (
                    <TallyProgressBar 
                      key={i} 
                      label={`Rating ${d.value}`} 
                      percentage={d.percentage} 
                      count={d.count} 
                    />
                  ))}
                  <Divider sx={{ mt: 4 }} />
                </Box>
              );
            }

            // Text questions — show sample answers
            return (
              <Box key={q._id}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>
                  {index + 1}. {q.text}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {q.total_answers} responses
                </Typography>
                {q.texts && q.texts.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {q.texts.slice(0, 10).map((answer, i) => (
                      <Paper key={i} elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1 }}>
                        <Typography variant="body2" fontStyle="italic" color="text.secondary">
                          "{answer}"
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <Typography color="text.secondary" fontStyle="italic">
                      No text responses yet.
                    </Typography>
                  </Paper>
                )}
                <Divider sx={{ mt: 4 }} />
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
}