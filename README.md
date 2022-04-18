bot for dejays place

[![dejays place lol](https://inv.wtf/widget/dejay)](https://inv.wtf/dejay)

selfhosting is not reccomended but here's the basics

> NOTE: there is no support for selfhosting, this is meant to be a custom, private bot

if you are not an otter university member then clone the snippets repo

if not, you probably want to remove commands/snippets

```ts
export const token = "bots token";
export const prefix = ".";
export const owners = ["your user id"];

export const datamining = "datamining channel id";
export const articles = "articles channel id";
export const role = "role id to use the bot";
```

then just run npm install and npm run start

todo: slash commands
