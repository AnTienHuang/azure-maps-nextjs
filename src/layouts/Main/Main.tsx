"use client"
import React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import Container from '@/components/Container';

import { Topbar } from './components';

interface Props {
  children: React.ReactNode;
}

const Main = ({
  children,
}: Props): JSX.Element => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'), {
    defaultMatches: true,
  });

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 38,
  });

  return (
    <Box>
      <AppBar
        position={'sticky'}
        sx={{
          top: 0,
          backgroundColor: "transparent",
        }}
        elevation={trigger ? 1 : 0}
      >
        <Container paddingY={1} maxWidth={'94vw'}>
          <Topbar/>
        </Container>
      </AppBar>
      <main>
        {children}
        <Divider />
      </main>
    </Box>
  );
};

export default Main;