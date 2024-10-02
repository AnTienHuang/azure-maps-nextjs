This is a sample Next.js project for an Azure Maps [tutorial](https://medium.com/@antien.huang/azure-maps-tutorial-with-nextjs-99f395f07a19?source=friends_link&sk=c3a20619f76e12fb7c55c76f97e2618f).

## Setup
- Add your own .env file based on the .env-template.

- To use the "Plain Map" tab (http://localhost:3000/Map), update the Azure Maps subscription key in `/src/components/Map.tsx`


## Run with Docker
1. Run `sh docker-up` or `docker compose up` in terminal.

2. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

No need to restart the container to see the changes you made, it is configured to refresh automatically.

In case of unexpected error for Azure Maps rendering, hard refresh your browser or reset your container with `sh docker-reset`.

## Learn More

- Contact me via [LinkedIn](https://www.linkedin.com/in/an-tien-huang/) or [email](mailto:antien.huang@gmail.com)
- [My Detailed tutorial for Azure Maps](https://medium.com/@antien.huang/azure-maps-tutorial-with-nextjs-99f395f07a19?source=friends_link&sk=c3a20619f76e12fb7c55c76f97e2618f)
