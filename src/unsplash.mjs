import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';

let unsplash;

export function createUnplashAPI(accessKey) {
  if (!accessKey) {
    throw new Error("Please provide a valid Unsplash Developer API Key: https://unsplash.com/developers");
  }

  unsplash = createApi({
    // TODO: remove my access key
    accessKey: accessKey || "7rHOgNNtUFaI2bOY61EyZqooBRHcMToGQEwxaGlwSvY",
    fetch: nodeFetch,
  });
}

export async function getImage(keywords) {
  const request = await unsplash.search.getPhotos({
    query: keywords,
    page: 1,
    perPage: 1,
    orderBy: "relevant"
  })
  console.log(request, "results:", request?.response?.results);
  return request?.response?.results?.[0].urls.regular || "";
}