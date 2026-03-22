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
            {!disabled && <TableCell align="right"><strong>Action</strong></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact._id}>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{contact.value}</TableCell>
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