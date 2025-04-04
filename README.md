# CF-Workers-AugmentOS-Cloud-Example-App

## NOTE: This repository is a proof of concept and is definitely rough around the edges.

### Install AugmentOS on your phone

AugmentOS install links: [AugmentOS.org/install](https://AugmentOS.org/install)

### (Easiest way to get started) Set up Cloudflare Quick Tunnels

1. `brew install cloudflared`

2. [Use Cloudflare Quick Tunnels to make a static address/URL](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)

### Register your APP with AugmentOS

<img width="181" alt="image" src="https://github.com/user-attachments/assets/36192c2b-e1ba-423b-90de-47ff8cd91318" />

1. Navigate to [console.AugmentOS.org](https://console.AugmentOS.org/)

2. Click "Sign In", and log in with the same account you're using for AugmentOS

3. Click "Create App"

4. Set a unique package name like `com.yourName.yourAppName`

5. For "Public URL", enter your Cloudflare Quick Tunnel static URL

### Get your APP running!

1. [Install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

2. Clone this repo: `git clone git@github.com:jarylc/cf-workers-augmentos-cloud-example-app.git`

3. cd into your repo, then type `npm install`

4. Update `PACKAGE_NAME` in `wrangler.toml` to match the package name you set in the AugmentOS console above

5. Create a file called `.dev.vars` and fill it with the following

	```
	API_KEY=<your-augmentos-api-key>
	```

6. Run `npx wrangler types` to generate types for autocompletion

7. Run `npx wrangler dev` to start a local dev environment on port `8787`

8. To quickly expose your app to the internet (and thus AugmentOS) with Cloudflare Quick Tunnels, run: `cloudflared tunnel --url 127.0.0.1:8787`

9. (When ready to deploy) Run `npx wrangler deploy` and follow the steps to deploy your app to Cloudflare

10. (When ready to deploy) Run `npx wrangler secret put API_KEY` and enter the API key you got from the AugmentOS console above
