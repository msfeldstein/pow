## Docker

Docker image is at msfeldstein/pub
Attach your books directory read-only to /pow-data and an empty folder for metadata read-write to /pow-meta, and publish port 3000

## Local Dev

```
Grab a collection of CBR files into a separate directory
git clone https://github.com/msfeldstein/pow.git
cd pow
yarn
<add a .env file from .env.template pointing to your comics collection and a path to store metadata (not in the content folder)>
yarn run dev
hit http://localhost:3000/api/reindex once to set up index
open http://localhost:3000 to view comics
```

