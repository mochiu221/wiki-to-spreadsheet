# Export WIKI table to spreadsheet

A program to export WIKI's table to google spreadsheet
(Currently only can export anime list)

## requirements

**Add** an empty json file: `/security/localdb.json`
This file will be used to record the related data about the exported WIKI table, for the purpose of the no duplicated table will be exported

**Add** env: `/config/dev.env`
**Edit** dev.env:

```
PORT=3000
```

**Add** google credentials: `/config/credentials.json`
See how to create credentials: https://developers.google.com/workspace/guides/create-credentials

1. create oauth client ID
2. set type: web application
3. the redirect uri must set: http://localhost:3000/oauth2

## run

```bash
npm run dev
```

## authorization

Go to http://localhost:3000/oauth2 to authorize the app for your google account
Token will be generated and can be found in `/config/token.json`

## using

Because this is only for my personal usage, I didn't make any UIUX, and this app will use GET method to do export directly.

1. Create a spreadsheet and copy the id
   The id can be found in URL, e.g. https://docs.google.com/spreadsheets/d/SPREADSHEET_ID

2. **Add** json: `/src/routers/wikianime.json`

   ```json
   {
     "sheetId": "SPREADSHEET_ID",
     "headerRange": "Anime!A1:Z1",
     "contentRange": "Anime!A2:Z",
     "header": [
       {
         "text": "開始日－(續播日)－結束日",
         "keys": ["開始", "首播"]
       },
       {
         "text": "作品名",
         "keys": ["作品", "中文"]
       },
       {
         "text": "原名",
         "keys": ["原名"]
       },
       {
         "text": "製作公司",
         "keys": ["製作", "公司"]
       },
       {
         "text": "話數",
         "keys": ["話數"]
       },
       {
         "text": "參考",
         "keys": ["參考", "網站"]
       }
     ],
     "pages": [
       "2000年日本動畫列表",
       "2001年日本動畫列表",
       "2002年日本動畫列表",
       "2003年日本動畫列表",
       "2004年日本動畫列表",
       "2005年日本動畫列表",
       "2006年日本動畫列表",
       "2007年日本動畫列表",
       "2008年日本動畫列表",
       "2009年日本動畫列表",
       "2010年日本動畫列表",
       "2011年日本動畫列表",
       "2012年日本動畫列表",
       "2013年日本動畫列表",
       "2014年日本動畫列表",
       "2015年日本動畫列表",
       "2016年日本動畫列表",
       "2017年日本動畫列表",
       "2018年日本動畫列表",
       "2019年日本動畫列表",
       "2020年日本動畫列表",
       "2021年日本動畫列表",
       "2022年日本動畫列表"
     ],
     "sections": ["1月－3月", "4月－6月", "7月－9月", "10月－12月"],
     "sectionIndexes": ["2", "3", "4", "5"]
   }
   ```

3. Update spreadsheet header
   http://localhost:3000/anime/update-header

4. Preview or update section
   http://localhost:3000/anime :

   - ?page: give the name of the wiki page, e.g. 2000 年日本動畫列表
   - ?section: give the section index of the wiki page
   - ?action: default preivew
     - =preivew: show table content
     - =appendsheet: update spreadsheet

5. Batch update pages found in wikianime.json
   http://localhost:3000/anime/batch-update :
   - ?process: default perpage
     - =perpage: update spreadsheet one single page found in wikianime.json (but not yet updated in localdb.json) everytime run this path

## resources

Check wiki api for anime list here: https://zh.wikipedia.org/w/api.php?action=parse&format=json&page=2006年日本動畫列表&contentmodel=json&prop=wikitext&section=4
