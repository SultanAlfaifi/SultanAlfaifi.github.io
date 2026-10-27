# تشغيل المساعد الذكي وقسم الـ CV

هذا الدليل لك يا سلطان. كل المفاتيح تكتبها أنت بنفسك، والكود ما يحتاج أي مفتاح عشان يبني أو يشتغل محليًا.

## كيف يشتغل باختصار

```
الموقع (GitHub Pages, ثابت)  ──►  Cloudflare Worker (sultan-agent)  ──►  OpenRouter (Claude Sonnet 5.5)
         │                              │  ├─ D1: الأسئلة (30 يوم، بدون IP) + الحدود اليومية + رموز التحقق
         │                              │  └─ Resend: الإيميلات
         └── لو الـ Worker طاح أو خلص الرصيد: الطرفية ترجع لردودها المكتوبة، والـ CV العام ينزل عادي
```

- **المعرفة**: يولّدها `npm run knowledge` من `data/portfolio.ts` و`data/portfolio-ar.ts` و`data/ui.ts` و`data/cv.ts`. أي تعديل في بيانات الموقع يوصل للمساعد في البناء الجاي، فما فيه نسخة ثانية تحتاج تحدّثها.
- **الحماية**: المساعد ما يرد إلا على صفحات موقعك (CORS)، وفيه Turnstile مرة لكل جلسة ومع كل إرسال إيميل، وحد بالدقيقة لكل زائر، وحدود يومية، وسقف الرصيد في OpenRouter هو الحد النهائي.
- **الإيميل**: المستلم ثابت في الكود على بريدك من بيانات الموقع، وبريد الزائر يصير reply-to بس.

## 1. اللي عليك تسويه (مرة وحدة)

### أ. حساب Cloudflare (مجاني)

1. سجّل في [dash.cloudflare.com](https://dash.cloudflare.com). ما تحتاج تنقل الـ DNS، يظل في Namecheap.
2. **فعّل بريدك في Cloudflare** من رابط التفعيل اللي وصلك. بدونه يرفض Cloudflare إنشاء أي Worker (الخطأ `code: 10034`). وإذا ما لقيت الرابط، تقدر تطلب إعادة إرساله من **My Profile** في اللوحة.
3. من مجلد المشروع:

```bash
npx wrangler login
```

### ب. قاعدة D1

```bash
npx wrangler d1 create sultan-agent
```

انسخ الـ `database_id` اللي يطلع، وحطه مكان الأصفار في `worker/wrangler.jsonc` (أول `d1_databases`، مو اللي تحت `env.dev`). وخلّ اسم الربط `DB` زي ما هو، مو الاسم اللي يقترحه wrangler. بعدين:

```bash
npm run agent:migrate
```

### ج. مفتاح OpenRouter بسقف رصيد

1. في [openrouter.ai](https://openrouter.ai) اشحن رصيد صغير (مثلًا 10$).
2. من **Settings → Keys** سوّ مفتاح جديد وحط له **Credit limit** (مثلًا 10$). هذا الحد هو صمام الأمان الأخير.
3. تأكد إن النموذج `anthropic/claude-sonnet-5.5` موجود في [openrouter.ai/models](https://openrouter.ai/models). لو الاسم مختلف، عدّل `MODEL` في `worker/wrangler.jsonc`.
4. خزّن المفتاح في Cloudflare (يطلب منك تلصقه، وما يظهر في أي ملف):

```bash
npx wrangler secret put OPENROUTER_API_KEY --config worker/wrangler.jsonc --env=""
```

**التكلفة التقريبية** مع Sonnet 5.5: بين 0.01 و0.045$ للسؤال، حسب طول المحادثة وإذا انقرأت المعرفة من الكاش. رصيد 10$ يكفي تقريبًا من 220 إلى 1000 سؤال. ولو خلص الرصيد، يتوقف المساعد 30 دقيقة وترجع الطرفية لردودها المكتوبة.

### د. Turnstile

1. في لوحة Cloudflare: **Turnstile → Add widget**.
2. الـ Hostnames: `sultalfaifi.com` و`www.sultalfaifi.com`، والوضع **Managed** (أغلب الزوار ما يشوفون شيء).
3. خذ الـ **Site key** (عام) والـ **Secret key**:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.jsonc --env=""
```

### هـ. سر الجلسات

ولّد نص عشوائي، وحطه سرًّا (يوقّع الجلسات وروابط الـ CV):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
npx wrangler secret put SESSION_SECRET --config worker/wrangler.jsonc --env=""
```

### و. Resend للإيميل

كل الرسائل تطلع من دومين الموقع نفسه، بقوالب HTML مرتبة ومعها نسخة نص عادي:

| الرسالة | من | لمن | الرد يروح لـ |
|---|---|---|---|
| رمز التحقق، ونسخة السيرة (بلغة الزائر) | `Sultan Alfaifi <hello@sultalfaifi.com>` | الزائر | `hello@sultalfaifi.com`، ويتحوّل لبريدك |
| رسالة زائر لك، وإشعارات تحميل السيرة (بالعربي) | `sultalfaifi.com <notifications@sultalfaifi.com>` | `sultalfaifi@gmail.com` | الزائر نفسه |

الإرسال ما يحتاج صندوق بريد حقيقي على هذي العناوين. ويمكنك في Gmail تسوي فلتر على `notifications@` يحطها تحت تصنيف.

1. سجّل في [resend.com](https://resend.com). المجاني يكفي: 3000 إيميل بالشهر و100 باليوم.
2. **Domains → Add domain → `sultalfaifi.com`**، واختر المنطقة **Ireland (eu-west-1)** لأنها الأقرب. يطلع لك ثلاث سجلات:
   - `MX` باسم `send` (الأولوية 10)
   - `TXT` باسم `send` (يبدأ بـ `v=spf1 include:amazonses.com`)
   - `TXT` باسم `resend._domainkey` (مفتاح DKIM)
3. في Namecheap: **Domain List → Manage → Advanced DNS**.
   - السجلين `TXT` تضيفهم من **Host Records → Add New Record**. اكتب في Host الاسم بس (`send` أو `resend._domainkey`)، بدون الدومين.
   - سجل `MX`: Namecheap ما يقبل MX إضافي وإعدادات البريد على **Email Forwarding**. غيّرها من **Mail Settings** إلى **Custom MX**، ثم أضف:
     - سجلات التحويل الحالية كما هي، عشان ما يتوقف أي تحويل عندك: `@` → `eforward1.registrar-servers.com` (10)، و`eforward2` (10)، و`eforward3` (10)، و`eforward4` (15)، و`eforward5` (20).
     - سجل Resend: `send` → القيمة اللي أعطاك Resend، والأولوية 10.
   - وأضف سجل DMARC، وهو اللي يخلي Gmail يثق في بريد الدومين أكثر: **TXT** باسم `_dmarc` والقيمة `v=DMARC1; p=none; rua=mailto:sultalfaifi@gmail.com`
   - لا تضيف سجل SPF ثاني على `@`. اللي يطلبه Resend يكون على `send`، وسجل `@` الحالي يبقى للتحويل.
4. اضغط **Verify** في Resend. التفعيل يأخذ من دقائق إلى ساعات.
5. بعد ما يصير **Verified**، سوّ API key بصلاحية **Sending access** ومحصورة على `sultalfaifi.com`، وأدخله بنفسك:

```bash
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.jsonc --env=""
```

العناوين في `worker/wrangler.jsonc`: `EMAIL_FROM` لرسائل الزوار و`EMAIL_NOTIFY_FROM` لإشعاراتك. والرد على رسائل الزوار يروح لـ `hello@sultalfaifi.com` (المتغير `EMAIL_REPLY_TO`)، وNamecheap يحوّله لبريدك في Gmail من **Domain → Redirect Email**. لو حذفت هذا التحويل، احذف المتغير معه، وإلا ترجع ردود الزوار بالخطأ.

### ز. النشر

```bash
npm run agent:deploy
```

يطلع لك رابط مثل `https://sultan-agent.<اسمك>.workers.dev`. جرّبه:

```bash
curl https://sultan-agent.<اسمك>.workers.dev/health
```

لازم يكون `"agent": true` و`"email": true`.

### ح. ربط الموقع بالـ Worker

في GitHub: **Settings → Secrets and variables → Actions → Variables** وأضف متغيرين عامّين (مو أسرار):

| الاسم | القيمة |
|---|---|
| `AGENT_URL` | رابط الـ Worker بدون `/` في الآخر |
| `TURNSTILE_SITE_KEY` | الـ Site key من Turnstile |

ملف `deploy-pages.yml` يمرّرهم للبناء. وأول ما تدفع لـ `main` (هذي خطوتك أنت)، يشتغل المساعد على الموقع.

> تنبيه «Multiple environments are defined» اللي يطلع مع أوامر wrangler عادي. الخيار `--env=""` يحدد بيئة الإنتاج ويخفي التنبيه.

## 2. التشغيل المحلي

`worker/.dev.vars` موجود عندك (وما يرتفع لـ git)، وفيه مفتاح Turnstile **التجريبي** حق Cloudflare وسر جلسات محلي. ضيف مفتاح OpenRouter في السطر `OPENROUTER_API_KEY=`، وإذا تبغى إرسال حقيقي ضيف `RESEND_API_KEY=`. بدونه تنطبع الإيميلات في طرفية wrangler ولا تنرسل.

```bash
npm run agent:migrate:local
```

```bash
npm run agent:dev
```

وفي طرفية ثانية:

```bash
npm run dev
```

ملف `.env.development.local` يوجّه الموقع المحلي لـ `http://127.0.0.1:8787` بمفتاح Turnstile التجريبي.

**بدون مفتاح OpenRouter** يرد `/health` بـ `"agent": false`. الطرفية تقول إن المساعد متوقف وترجع للردود المكتوبة، والأسئلة الحرة تروح لأقرب أمر مكتوب. وتفصيل الـ CV حسب المجال يشتغل كامل بدون ذكاء اصطناعي.

**لو تبغى تجرّب الواجهة بدون ما تصرف شيء**، فيه بديل وهمي لـ OpenRouter:

```bash
node evals/mock-openrouter.mjs
```

وحط في `worker/.dev.vars` مؤقتًا:

```
OPENROUTER_API_KEY=mock
OPENROUTER_URL=http://127.0.0.1:8788/api/v1/chat/completions
```

## 3. الـ Evals (44 سؤال)

الأسئلة في `evals/questions.json`: 30 إنجليزي و14 عربي، ومنها هجومية (حقن تعليمات، طلب البرومبت، انتحال شخصيتك، مقارنة بمرشحين ثانيين، أسئلة ما لها جواب في الموقع). التصحيح آلي بالكامل: حقائق لازم تنذكر، وأشياء ممنوع تنقال، ومرساة لازم يستشهد فيها، والأداة اللي لازم تشتغل، ولغة الجواب.

مع `npm run agent:dev` ومفتاحك في `.dev.vars`:

```bash
npm run evals
```

النتائج تنحفظ في `evals/results/latest.json`، وتنعرض كاملة في صفحة `/agent-evals/` بعد البناء، والإخفاقات معها. التشغيل الكامل يكلف تقريبًا بين 0.5 و2$. وتقدر تشغّل أسئلة محددة:

```bash
npm run evals -- --only en-23,ar-12
```

ولو عدّلت فحصًا في `evals/questions.json`، تقدر تعيد تصحيح آخر تشغيل على الإجابات المحفوظة، بدون ما تكلّم النموذج ولا تصرف شيء. الأمر يطبع بس الأحكام اللي بتتغير، وما يعدّل النتائج المنشورة:

```bash
npx tsx evals/regrade.ts
```

## 4. الخصوصية وإيش ينحفظ

- **الأسئلة** (جدول `questions` في D1): نص السؤال (أول 500 حرف)، ولغة الصفحة، والأدوات اللي اشتغلت، وكيف انتهى. بدون IP أو إيميل أو جلسة أو الجواب نفسه، وتنحذف تلقائيًا بعد 30 يوم (cron يومي).
- **الحدود اليومية**: بمفتاح مشفّر يتغيّر كل يوم بدل الـ IP.
- **رموز التحقق**: مشفّرة، تعيش 10 دقائق، وتنحذف بعد الاستخدام.

تشوف آخر الأسئلة بـ:

```bash
npx wrangler d1 execute sultan-agent --remote --config worker/wrangler.jsonc --command "SELECT datetime(created_at/1000,'unixepoch') AS at, locale, outcome, tools, question FROM questions ORDER BY created_at DESC LIMIT 30"
```

## 5. الحدود (عدّلها في `worker/wrangler.jsonc`)

| المتغير | الافتراضي |
|---|---|
| `DAILY_CHAT_CAP` / `DAILY_CHAT_PER_VISITOR` | 400 سؤال باليوم للكل، و40 للزائر الواحد |
| `DAILY_EMAIL_CAP` / `DAILY_EMAIL_PER_VISITOR` | 25 إيميل لك باليوم، و3 للزائر |
| `DAILY_CODE_CAP` | 40 رمز تحقق باليوم، و3 للبريد أو الزائر |
| `DAILY_TAILOR_CAP` / `DAILY_TAILOR_PER_VISITOR` | 80 تفصيل CV بالذكاء الاصطناعي، و8 للزائر |
| `ratelimits` | 8 أسئلة بالدقيقة للزائر، و4 إجراءات بالدقيقة |

## 6. مكتبة نقاط الـ CV (تحتاج موافقتك)

`data/cv.ts` فيها كل سطر ممكن يطلع في الـ CV. كتبتها من نصوص الموقع نفسها، ولكل سطر مرساة مصدره، والاختبارات تتأكد إن كل رقم فيها منشور في الموقع. **راجعها قبل النشر**، وأي سطر ما توافق عليه حط له `approved: false`. الـ Worker يرفض أي ID مو في المكتبة أو مو معتمد، والذكاء الاصطناعي يختار ويرتّب بس، وما يكتب إلا كلمة الغلاف القصيرة.

- **الـ CV العام**: يتولّد وقت البناء في `public/cv/Sultan-Alfaifi-CV.pdf`. صفحة واحدة، بالإنجليزي، نص حقيقي تقرؤه أنظمة ATS، وروابطه قابلة للضغط. ويظهر كذلك رابط «Download my CV» في قسم About.
- **قاعدة الصفحة الواحدة**: المولّد يقيس الصفحات ويحذف الأقل أهمية لين تصير صفحة واحدة، والاختبار يفشل لو أي نسخة تعدّت صفحة، حتى أكبر اختيار ممكن.

## 7. لو صار شيء

| العَرَض | السبب الغالب | الحل |
|---|---|---|
| الطرفية تقول إن المساعد متوقف | `/health` يرد `"agent": false` | تأكد من `OPENROUTER_API_KEY` و`TURNSTILE_SECRET_KEY` بأمر `npx wrangler secret list --config worker/wrangler.jsonc` |
| «ما قدرت أوصل للمساعد» مع كل سؤال | OpenRouter يرفض الطلب (400)، مثلًا بسبب اسم النموذج أو خيار `reasoning` | شوف السجل بأمر `npx wrangler tail --config worker/wrangler.jsonc`. جرّب تخلي `REASONING_EFFORT` فاضي، أو صحّح `MODEL` |
| «خلصت ميزانية المساعد» | وصلت سقف الرصيد في OpenRouter | زد الرصيد أو السقف. والمساعد يرجع تلقائيًا بعد 30 دقيقة |
| الإيميلات ما توصل | الدومين مو Verified في Resend، أو `EMAIL_FROM` أو `EMAIL_NOTIFY_FROM` على دومين ثاني | راجع سجلات DNS في Namecheap وصفحة Domains في Resend، وصفحة Emails فيه تبيّن سبب أي رسالة رجعت |
| التحويل على الدومين وقف بعد Custom MX | سجلات `eforward` ناقصة | أضف سجلات `eforward1` إلى `eforward5` على `@` كما في الخطوة و |
| خطأ CORS في المتصفح | الرابط في `AGENT_URL` غلط، أو الدومين مو في `ALLOWED_ORIGINS` | صحّح المتغير في GitHub، أو أضف الدومين في `worker/wrangler.jsonc` ثم `npm run agent:deploy` |

## 8. معلومات تنتظر تأكيدك

المساعد ينقل الموقع زي ما هو. فلما تصحّح هذي في `data/portfolio.ts` و`data/portfolio-ar.ts`، يتحدث المساعد والـ CV تلقائيًا:

- هل WAREVA اسم المنتج ولا اسم الفريق بعد الاندماج.
- هل نذكر «فريق من ستة».
- سطر «Open to roles».
- سنة «Top 5%» في KAUST.
