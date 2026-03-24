import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ContactList({ contacts, onDelete, disabled = false }) {
  if (contacts.length === 0) {
    return <Typography color="text.secondary">No contacts added yet.</Typography>;
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
          <TableRow>
            <TableCell><strong>Mobile Number</strong></TableCell>
            {contacts[0]?.access_url && <TableCell><strong>Secure Link</strong></TableCell>}
            {!disabled && <TableCell align="right"><strong>Action</strong></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact._id}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{contact.value}</TableCell>
              {contact.access_url && (
                <TableCell>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: '#F1F5F9', 
                      px: 1, py: 0.5, 
                      borderRadius: 1,
                      border: '1px solid #E2E8F0',
                      wordBreak: 'break-all',
                      color: 'secondary.main',
                      userSelect: 'all' 
                    }}
                  >
                    {contact.access_url}
                  </Typography>
                </TableCell>
              )}
              {!disabled && (
                <TableCell align="right">
                  <IconButton color="error" onClick={() => onDelete(contact._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}