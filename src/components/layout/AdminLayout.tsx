import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <Box>
      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default AdminLayout