# dsh-cyrene-pet

> Cyrene 鏄旀稛 Spine 妗屽疇鎻掍欢 for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)锛坄dsh`锛?
涓€涓偓娴湪 DSH Web 鐣岄潰涓婄殑 Q 鐗堟様娑熸瀹狅紙Spine 楠ㄩ鍔ㄧ敾锛夛紝瀹炴椂鍙嶆槧浼氳瘽鐘舵€侊細token 鐢ㄩ噺銆佹潈闄?鎻愰棶璇锋眰銆佹€濊€?鎵ц宸ュ叿/鎶ラ敊绛夛紝骞舵敮鎸佹嫋鎷姐€佺缉鏀俱€侀暅鍍忋€佽嚜瀹氫箟瑁呴グ缁勫悎銆?
## 鉁?鍔熻兘

- **鐘舵€佽嚜鍔ㄥ垏鎹?*锛氬緟鏈?/ 鎬濊€?/ 宸ヤ綔 / 璇锋眰鏉冮檺 / 鎶ラ敊锛屾挱鏀鹃€熷害 + 鍏夌幆鑴夊啿 + 绮夎壊楂樹寒
- **鐢ㄩ噺灞曠ず**锛氳緭鍏?/ 杈撳嚭 / 缂撳瓨璇?/ 缂撳瓨鍐?/ 鎺ㄧ悊 tokens銆佸綋鍓嶆ā鍨嬨€佽姹傛暟锛堝弻鍑诲疇鐗╂垨闈㈡澘寮€鍏筹級
- **鏉冮檺/鎻愰棶搴旂瓟**锛氭巿鏉冭姹備笌 `ask_user_question` 鍒拌揪鏃跺疇鐗╀寒璧凤紝姘旀场鍐呭彲鐩存帴鐐广€屽厑璁镐竴娆?/ 鎷掔粷 / 閫夐」銆嶅簲绛?- **鑷姩鐪ㄧ溂**锛氫娇鐢ㄦā鍨嬭嚜甯︾殑 `B闂溂` 妲戒綅锛岀害姣?3~6 绉掔湪鐪硷紙鍙叧锛?- **鑷敱鎿嶄綔**锛氭嫋鎷界Щ鍔ㄣ€佸彸涓嬭鎷栨嫿缂╂斁锛?0%鈥?50%锛夈€佹ā鍨嬮暅鍍忋€丠UD 鏀惧乏/鍙充晶
- **瑁呴グ鑷敱缁勫悎**锛氱鍗?/ 鍏夌偣鏄熸槦鍙跺瓙甯﹀瓙 / 鍦ｅ厜鍏夋煴 / 鍏夌幆 / 鍚庤鎽嗭紝鍚勮嚜鐙珛寮€鍏筹紙榛樿闅愯棌鎾戝ぇ鍙栨櫙鐨勫満鏅亾鍏凤紝淇濈暀鍏夌幆涓庡悗瑁欐憜锛?- **绐楀彛寮忚缃潰鏉?*锛氱矇鑹叉偓娴獥锛屽彲鎷栨爣棰樻爮绉诲姩銆佷綅缃蹇?
## 馃摝 瀹夎锛堜竴閿級

```sh
# 闇€瑕?pnpm 鍦?PATH 涓婏紙濡傛湭瀹夎锛歯pm i -g pnpm 鎴?corepack enable pnpm锛?dsh plugin --profile web add @yydscjy/dsh-cyrene-pet
```

鐒跺悗**閲嶅惎 `dsh web`**锛屽埛鏂伴〉闈紝鍙充笅瑙掑嚭鐜版瀹犮€?
> 鍖呭０鏄庝簡 `dsh.bundle`锛宍dsh plugin add` 浼氳嚜鍔ㄦ妸瀹冨姞鍏?profile 鐨?bundles 骞跺湪鍚姩鏃跺簲鐢ㄥ寘鍐?`cordis.patch.yml`锛堟敞鍐?`cyrene-pet` 娴忚鍣ㄦ潯鐩級锛屾棤闇€鎵嬪姩鏀归厤缃€?
### 鍗歌浇

```sh
dsh plugin --profile web remove @yydscjy/dsh-cyrene-pet
```

閲嶅惎 `dsh web` 鍗冲彲銆?
## 馃敤 鏈湴寮€鍙?/ 鏋勫缓

```sh
# 鏋勫缓渚濊禆锛堜竴娆★級鈥斺€?鏃?pnpm 鏃朵篃鍙敤锛?#   node C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js install --prefix runtime --cache .npm-cache --ignore-scripts --no-audit --no-fund rollup @rollup/plugin-node-resolve @esotericsoftware/spine-player@4.1.56

node scripts\build-client.mjs   # 浜у嚭 lib/client.js锛坮ollup 鎵撳寘锛屽惈 Spine 寮曟搸锛?node scripts\smoke-test.cjs     # 鍐掔儫娴嬭瘯锛堝彲閫夛級
node scripts\install.mjs        # 澶囬€夛細鎵嬪姩澶嶅埗杩?$DSH_HOME profile锛堜笉鍙戝竷鏃剁敤锛?```

## 馃搧 鐩綍

```
鈹溾攢 package.json          # dsh.bundle + dsh.client 鍙屽０鏄?鈹溾攢 cordis.patch.yml      # bundle patch锛氭敞鍐?cyrene-pet 娴忚鍣ㄦ潯鐩?鈹溾攢 lib/
鈹? 鈹溾攢 index.js           # node 绔細/pet-assets 璺敱浼烘湇妯″瀷
鈹? 鈹溾攢 client.js          # 娴忚鍣?bundle锛堟瀯寤轰骇鐗╋級
鈹? 鈹斺攢 invariant.js
鈹溾攢 src/client.js         # 娴忚鍣ㄧ婧愮爜
鈹溾攢 assets/               # 妯″瀷璧勬簮锛圫pine 4.1.24 Avatar锛?鈹斺攢 scripts/              # 鏋勫缓/娴嬭瘯/瀹夎/璇婃柇鑴氭湰
```

## 馃З 妯″瀷璇存槑

- 绱犳潗锛歚Q鐗堟様娑焋锛圫pine 4.1.24锛夛紝浠呬娇鐢?`_Avater` 楠ㄦ灦锛堣鑹叉湰浣?+ 鍏夌幆锛?- 鍐呯疆鍔ㄧ敾浠?`FadeIn`锛堝叆鍦猴級涓?`Loop`锛堝緟鏈哄惊鐜級锛涚湪鐪笺€佽〃鎯呯敱妲戒綅鍒囨崲鍚堟垚
- 娓叉煋寮曟搸锛歔@esotericsoftware/spine-player](https://www.npmjs.com/package/@esotericsoftware/spine-player) 4.1.56锛圫pine Runtimes License锛屽厤璐癸級
- 妯″瀷鏂囦欢涓鸿В鍖呯礌鏉愶紝浠呬緵涓汉瀛︿範浣跨敤锛涘彂甯?鍒嗗彂鏃惰鑷纭绱犳潗鎺堟潈

## 馃摛 鍙戝竷

```sh
npm login
npm publish            # 闇€瑕?@yydscjy 浣滅敤鍩熸潈闄?```

## 馃敄 License

MIT锛堟ā鍨嬬礌鏉愮増鏉冨綊鍘熶綔鑰呮墍鏈夛級
