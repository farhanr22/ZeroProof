import React from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent, IconButton, Typography, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

export default function QuestionEditor({ index, question, onRemove, onUpdate, onAddOption, onUpdateOption, onRemoveOption, disabled = false }) {
  const showOptions = question.type === 'single_choice' || question.type === 'multi_choice';

  return (
    <Card elevation={1} sx={{ border: '1px solid #E2E8F0', opacity: disabled ? 0.7 : 1 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">Question {index + 1}</Typography>
          {!disabled && (
            <IconButton color="error" onClick={onRemove}><DeleteIcon /></IconButton>
          )}
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={showOptions ? 2 : 0}>
          <TextField 
            fullWidth label="Question Text" variant="outlined" 
            value={question.text} 
            onChange={(e) => onUpdate('text', e.target.value)}
            disabled={disabled}
          />
          <FormControl sx={{ minWidth: { xs: '100%', md: 200 } }}>
            <InputLabel>Type</InputLabel>
            <Select 
              value={question.type} label="Type" 
              onChange={(e) => onUpdate('type', e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="text">Text Feedback</MenuItem>
              <MenuItem value="single_choice">Single Choice (MCQ)</MenuItem>
              <MenuItem value="multi_choice">Multiple Choice (MSQ)</MenuItem>
              <MenuItem value="rating">Rating (1-10)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Dynamic Options Builder for MCQ/MSQ */}
        {showOptions && (
          <Box pl={2} borderLeft="3px solid #E2E8F0">
            <Typography variant="caption" color="text.secondary" mb={1} display="block">Answer Options</Typography>
            {question.options.map((opt, optIndex) => (
              <Box display="flex" gap={1} mb={1} key={optIndex} alignItems="center">
                <TextField 
                  size="small" fullWidth value={opt} 
                  onChange={(e) => onUpdateOption(optIndex, e.target.value)}
                  disabled={disabled}
                  placeholder={`Option ${optIndex + 1}`}
                />
                {!disabled && onRemoveOption && (
                  <IconButton size="small" onClick={() => onRemoveOption(optIndex)} color="error">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            {!disabled && (
              <Button size="small" onClick={onAddOption}>+ Add Option</Button>
            )}
          </Box>
        )}

        {/* Info text for rating type */}
        {question.type === 'rating' && (
          <Box pl={2} borderLeft="3px solid #E2E8F0" mt={2}>
            <Typography variant="caption" color="text.secondary">
              Respondents will use a slider to rate from 1 to 10. No options needed.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}