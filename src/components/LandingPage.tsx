'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Container from '@/components/Container';

const LandingPageComp = (): JSX.Element => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'), {
    defaultMatches: true,
  });

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, ${alpha(
            theme.palette.background.paper,
            0,
          )}, ${alpha(theme.palette.alternate.main, 1)} 100%)`,
          backgroundRepeat: 'repeat-x',
          position: 'relative',
        }}
      >
        <Box paddingY={{ xs: 0, sm: '4rem', md: '8rem' }}>
          <Container>
            <Box>
              <Typography
                variant="h2"
                color="text.primary"
                gutterBottom
                sx={{
                  fontWeight: 700,
                }}
              >
                This is a sample website for Azure Maps with NextJS demo
              </Typography>
              <Typography
                variant="h6"
                component="p"
                color="text.secondary"
                sx={{ fontWeight: 400 }}
              >
              </Typography>
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretched', sm: 'flex-start' }}
                marginTop={4}
              >
                <Button
                  component={'a'}
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth={isMd ? false : true}
                  href={'/MapWithList'}
                >
                  Map with Location List
                </Button>
                <Box
                  marginTop={{ xs: 2, sm: 0 }}
                  marginLeft={{ sm: 2 }}
                  width={{ xs: '100%', md: 'auto' }}
                >
                  <Button
                    component={'a'}
                    href={'/MapWithRoute'}
                    variant="outlined"
                    color="primary"
                    size="large"
                    fullWidth={isMd ? false : true}
                  >
                    Map with Route
                  </Button>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
        <Box
          component={'svg'}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 1920 100.1"
          sx={{
            width: '100%',
            marginBottom: theme.spacing(-1),
          }}
        >
          <path
            fill={theme.palette.background.paper}
            d="M0,0c0,0,934.4,93.4,1920,0v100.1H0L0,0z"
          ></path>
        </Box>
      </Box>
      <Divider />
    </Box>
  );
};

export default LandingPageComp;
