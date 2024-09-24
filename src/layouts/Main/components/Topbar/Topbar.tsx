import React from 'react';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import Link from 'next/link';


const Topbar = (): JSX.Element => {
  return (
    <Box
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      width={1}
    >
      <Box
        display={"flex"}
        component="a"
        href="/"
        title="Home"
        width={{ xs: 200, md: 250 }}
      >
        <Typography variant='h6'>Azure Maps with NextJS</Typography>
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" } }} alignItems={"center"}>
        <Box mr={'32px'}>
          <Link href="/MapWithList">Map With List</Link>
        </Box>
        <Box mr={'32px'}>
          <Link href="/MapWithRoute">Map With Route</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Topbar;
