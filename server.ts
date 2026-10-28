import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run and container environments set PORT=8080 for Nginx.
// Nginx proxies incoming traffic to localhost:3000.
// Node/Express must bind to 3000 (or APP_PORT), NEVER 8080 which belongs to Nginx.
const PORT = parseInt(
  process.env.APP_PORT || (process.env.PORT === '8080' ? '3000' : (process.env.PORT || '3000')),
  10
);

app.use(express.json());

// API: Nugen / Gemini AI Status Check
app.get('/api/nugen/status', (_req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const hasNugen = Boolean(process.env.NUGEN_API_KEY && process.env.NUGEN_API_KEY.trim().length > 0);
  const isConfigured = hasGemini || hasNugen;

  res.json({
    configured: isConfigured,
    provider: hasGemini ? 'Google Gemini AI' : hasNugen ? 'Nugen Intelligence' : 'HeatShield Local Engine',
    status: isConfigured ? 'live' : 'demo_mode',
    message: isConfigured
      ? 'Live AI Intelligence connected (multilingual safety officer active).'
      : 'Running in verified offline demonstration mode with complete English, Hindi, and Marathi rules.',
    docs: 'https://docs.nugen.in/'
  });
});

// API: Multilingual Chat Proxy (Supports Gemini API, Nugen, and Local Expert Rule Engine)
app.post('/api/nugen/chat', async (req: Request, res: Response) => {
  const { messages, context } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const nugenKey = process.env.NUGEN_API_KEY?.trim();
  const nugenBase = process.env.NUGEN_BASE_URL?.trim() || 'https://api.nugen.in/v1';
  const lang = (context?.language || 'en').toLowerCase();

  // 1. Try Gemini API if key is present
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const langPrompt =
        lang === 'mr'
          ? 'महत्त्वाची सूचना: उत्तर पूर्णपणे शुद्ध, सुस्पष्ट, आणि सोप्या मराठीत (मराठी/Devanagari script) द्या. महाराष्ट्रातील वाहतूक पोलिसांसाठी व्यावहारिक आणि समजण्यास सोपे मार्गदर्शन करा.'
          : lang === 'hi'
          ? 'महत्वपूर्ण निर्देश: उत्तर पूरी तरह से स्पष्ट, सरल और सम्मानजनक हिन्दी (हिंदी/Devanagari script) में दें। ट्रैफिक पुलिसकर्मियों और फील्ड सुपरवाइजरों के लिए व्यावहारिक मार्गदर्शन करें।'
          : 'Respond in clear, professional English.';

      const systemInstruction = `You are HeatShield AI Safety Officer, an expert occupational heat stress and climate safety specialist for traffic police, outdoor workers, and supervisors.
Location context: ${JSON.stringify(context || {})}.
${langPrompt}
Follow occupational heat strain guidelines (ACGIH/OSHA/WHO). Never provide a formal medical certification of health. Always offer immediate triage for heat stroke (emergency cooling, 112/108). Format your answer cleanly with bullet points and bold section titles.`;

      const promptText = (messages || [])
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const geminiResp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 800
        }
      });

      const reply = geminiResp.text;
      if (reply && reply.trim().length > 0) {
        return res.json({
          reply,
          mode: 'gemini_live',
          model: 'gemini-2.5-flash',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, trying next provider:', err.message);
    }
  }

  // 2. Try Nugen API if configured
  if (nugenKey) {
    try {
      const response = await fetch(`${nugenBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nugenKey}`
        },
        body: JSON.stringify({
          model: 'nugen-chat-default',
          messages: [
            {
              role: 'system',
              content: `You are HeatShield AI Safety Officer, an expert occupational heat stress and climate safety specialist for traffic police. Location: ${JSON.stringify(
                context || {}
              )}. Answer in ${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}.`
            },
            ...(messages || [])
          ],
          temperature: 0.6,
          max_tokens: 650
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.reply;
        if (content) {
          return res.json({
            reply: content,
            mode: 'live_nugen',
            model: data.model || 'nugen-chat',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err: any) {
      console.warn('Nugen API error or timeout, falling back to local safety rules:', err.message);
    }
  }

  // 3. Multilingual Local Rule Engine (Natural English, Hindi, and Marathi)
  const lastUserMsg = messages?.[messages.length - 1]?.content || '';
  const reply = generateSafetyAssistantDemoResponse(lastUserMsg, context);

  return res.json({
    reply,
    mode: 'demo',
    model: 'heatshield-climate-safety-rule-engine',
    timestamp: new Date().toISOString(),
    notice: 'Generated by HeatShield AI Multilingual Safety Engine.'
  });
});

// Helper for local climate safety advisor with full multilingual support (English, Hindi, Marathi)
function generateSafetyAssistantDemoResponse(userQuery: string, context?: any): string {
  const queryLower = userQuery.toLowerCase();
  const locName = context?.locationName || 'the assigned duty post';
  const temp = context?.temperature ? `${context.temperature}°C` : 'current temperature';
  const humidity = context?.humidity ? `${context.humidity}% RH` : 'relative humidity';
  const riskCategory = context?.riskCategory || 'Moderate';
  const lang = (context?.language || 'en').toLowerCase();

  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userQuery);
  const isMarathi = lang === 'mr';

  // Heatstroke emergency & Symptoms difference
  if (
    queryLower.includes('heat stroke') ||
    queryLower.includes('heatstroke') ||
    queryLower.includes('faint') ||
    queryLower.includes('unconscious') ||
    queryLower.includes('emergency') ||
    queryLower.includes('stroke vs') ||
    queryLower.includes('difference') ||
    queryLower.includes('symptom') ||
    queryLower.includes('लक्षण') ||
    queryLower.includes('बेहोश') ||
    queryLower.includes('लू') ||
    queryLower.includes('चक्कर') ||
    queryLower.includes('उष्माघात')
  ) {
    if (isMarathi) {
      return `🚨 **उष्माघात (HEATSTROKE) व उष्मा थकवा (HEAT EXHAUSTION) फरक आणि तातडीचा प्रथमोपचार प्रोटोकॉल**:

### १. लक्षणे कशी ओळखायची:
• **उष्मा थकवा (Heat Exhaustion)**: भरपूर घाम येणे, त्वचा थंड व चिकट पडणे, जलद नाडी, चक्कर येणे, स्नायूंमध्ये पेटके.
• **उष्माघात (Heat Stroke - अतिगंभीर)**: शरीराचे तापमान > ४०°से (१०४°फॅ), **घाम येणे पूर्णपणे बंद होणे**, त्वचा कोरडी व अतिउष्ण, मानसिक गोंधळ, बोलण्यात अडखळणे किंवा बेशुद्ध पडणे.

### २. तातडीचे ४ प्रथमोपचार पावले:
१. **रुग्णवाहिका संपर्क**: स्थानिक आपत्कालीन सेवेशी (१०८ किंवा ११२) त्वरित संपर्क साधा.
२. **सावलीत हलवा**: वाहतूक अंमलदाराला डांबरी रस्त्यावरून तात्काळ वातानुकूलित वाहनात किंवा कॅनोपी शेडमध्ये हलवा. घट्ट गणवेश सैल करा.
३. **सक्रिय शीतकरण (Active Cooling)**:
   - मान, काख आणि पोटावर थंड पाण्याच्या पट्ट्या किंवा बर्फाचे पॅक ठेवा.
   - अंगावर थंड पाणी शिंपडा आणि सतत जोराने वारा घाला.
४. **पाणी देण्याचा नियम**: व्यक्ती बेशुद्ध किंवा अर्धवट शुद्धीत असल्यास **पाणी किंवा ओआरएस जबरदस्तीने पाजू नका**.

*सूचना: हे तातडीचे प्रथमोपचार मार्गदर्शन आहे. ताबडतोब वैद्यकीय मदत मिळवणे आवश्यक आहे.*`;
    }

    if (isHindi) {
      return `🚨 **हीट स्ट्रोक (लू लगना) एवं हीट एग्जॉशन: लक्षण पहचान एवं आपातकालीन प्राथमिक उपचार प्रोटोकॉल**:

### 1. लक्षणों में अंतर:
• **हीट एग्जॉशन (सामान्य लू)**: अत्यधिक पसीना आना, त्वचा ठंडी व चिपचिपी होना, कमजोरी, चक्कर आना, उल्टी का अहसास।
• **हीट स्ट्रोक (अति गंभीर)**: शरीर का तापमान > 40°C (104°F), **पसीना आना बंद हो जाना**, त्वचा गर्म व लाल होना, मानसिक भ्रम, बोलने में लड़खड़ाहट या बेहोशी।

### 2. तत्काल 4-चरणीय प्राथमिक उपचार:
1. **एम्बुलेंस को कॉल करें**: तुरंत आपातकालीन सेवा (108 या 112) पर कॉल करें।
2. **छायादार स्थान पर ले जाएं**: कर्मी को गर्म डामर सड़क से हटाकर तुरंत छायादार या वातानुकूलित स्थान पर ले जाएं। वर्दी की बेल्ट और भारी जैकेट ढीली करें।
3. **सक्रिय कूलिंग**:
   - गर्दन, बगल और कमर के जोड़ों पर बर्फ के पैक या ठंडे गीले तौलिए लगाएं।
   - शरीर पर ठंडा पानी छिड़कें और लगातार पंखा चलाएं।
4. **जलयोजन सावधानी**: यदि व्यक्ति बेहोश, उल्टी कर रहा हो या भ्रम में हो, तो जबरन पानी या ओआरएस **बिल्कुल न पिलाएं**।

*सूचना: यह प्राथमिक चिकित्सा मार्गदर्शन है। तुरंत अस्पताल ले जाना अनिवार्य है।*`;
    }

    return `🚨 **HEATSTROKE VS HEAT EXHAUSTION: SYMPTOMS & EMERGENCY PROTOCOL**

### 1. Differentiating Symptoms:
• **Heat Exhaustion**: Heavy profuse sweating, cold/clammy skin, rapid weak pulse, dizziness, nausea, and muscle cramps.
• **Heat Stroke (Medical Emergency)**: Core body temp > 40°C (104°F), **complete cessation of sweating**, hot red dry skin, confusion, slurred speech, or loss of consciousness.

### 2. Immediate 4-Step Field Action Plan:
1. **Call Emergency Hotline**: Dial 108 / 112 / 911 immediately.
2. **Relocate to Shade**: Move officer off asphalt roadway into an air-conditioned cruiser or shaded tent. Loosen restrictive uniform vests.
3. **Rapid Active Cooling**:
   - Apply cold packs or ice to neck, axillae (armpits), and groin.
   - Spritz with cold water and fan vigorously.
4. **Hydration Warning**: **Do NOT** force liquids if the officer is semi-conscious, disoriented, or vomiting.`;
  }

  // Hydration & ORS
  if (
    queryLower.includes('hydration') ||
    queryLower.includes('water') ||
    queryLower.includes('drink') ||
    queryLower.includes('ors') ||
    queryLower.includes('electrolyte') ||
    queryLower.includes('पाणी') ||
    queryLower.includes('जल') ||
    queryLower.includes('पानी')
  ) {
    if (isMarathi) {
      return `💧 **${locName} येथील वाहतूक पोलिसांसाठी हायड्रेशन व ओआरएस (ORS) वेळापत्रक**:

सध्याचे तापमान ${temp} आणि आर्द्रता ${humidity} (${riskCategory} जोखीम):
• **पाणी पिण्याचे प्रमाण**: चौकात ड्युटी करताना दर **१५ ते २० मिनिटांनी २५० मिली (१ ग्लास) थंड पाणी** अवश्य प्या. तहान लागण्याची वाट पाहू नका.
• **इलेक्ट्रोलाइट्स व ओआरएस**: २ तासांपेक्षा जास्त वेळेच्या उन्हातील ड्युटीसाठी १ लिटर पाण्यात १ पाकीट ओआरएस (ORS) मिसळून प्या किंवा लिंबू-पाणी/नारळपाणी घ्या.
• **मूत्र रंग तपासणी**: फिकट पिवळा रंग उत्तम हायड्रेशन दर्शवतो; गडद पिवळा किंवा लालसर रंग दिसल्यास त्वरित विश्रांती घेऊन पाणी पिणे गरजेचे आहे.
• **काय टाळायचे**: अति चहा, कॉफी किंवा अति साखरयुक्त शीतपेये टाळा, ज्यामुळे डिहायड्रेशन वाढते.`;
    }

    if (isHindi) {
      return `💧 **${locName} पर तैनात ट्रैफिक पुलिसकर्मियों के लिए जलपान (हाइड्रेशन) एवं ओआरएस निर्देश**:

वर्तमान स्थिति: ${temp} एवं ${humidity} (${riskCategory} जोखिम):
• **पानी पीने की मात्रा**: धूप में ड्यूटी के दौरान हर **15 से 20 मिनट में कम से कम 250 मिली (एक गिलास) ठंडा पानी** पिएं। प्यास लगने का इंतजार न करें।
• **ओआरएस/इलेक्ट्रोलाइट्स**: 2 घंटे से अधिक की तैनाती के लिए 1 लीटर पानी में 1 पाउच ओआरएस घोलें। इससे पसीने में निकले सोडियम और पोटैशियम की भरपाई होती है।
• **यूरिन कलर मॉनिटरिंग**: हल्का पीला रंग पर्याप्त जल स्तर दिखाता है; गहरा पीला रंग गंभीर निर्जलीकरण का संकेत है।
• **परहेज**: अत्यधिक चाय, कॉफी और अधिक शर्करा युक्त कोल्ड ड्रिंक्स से बचें।`;
    }

    return `💧 **Hydration Protocols for Outdoor Traffic Officers at ${locName}**:

Under microclimate conditions of ${temp} and ${humidity} (${riskCategory} Risk):
• **Consumption Rate**: Drink 250 ml (1 cup) of cool water every 15 to 20 minutes on point duty. Do not wait until thirst develops.
• **Electrolytes & ORS**: For shifts exceeding 2 hours in direct sun, replace sodium and potassium losses via ORS (Oral Rehydration Salts) or chilled electrolyte water.
• **Monitoring**: Check urine color (pale straw indicates good hydration; dark amber indicates immediate rest and rehydration required).
• **Avoid**: High-sugar sodas and excessive caffeinated tea/coffee, which impair thermal regulation.`;
  }

  // Duty Rotation & Shift Planning
  if (
    queryLower.includes('rotation') ||
    queryLower.includes('schedule') ||
    queryLower.includes('shift') ||
    queryLower.includes('wbgt') ||
    queryLower.includes('30°c') ||
    queryLower.includes('planner') ||
    queryLower.includes('रोटेशन') ||
    queryLower.includes('बदली') ||
    queryLower.includes('शिफ्ट') ||
    queryLower.includes('वेळापत्रक')
  ) {
    if (isMarathi) {
      return `🔄 **${locName} साठी स्मार्ट ड्युटी रोटेशन व विश्रांती धोरण (WBGT > ३०°C)**:

• **सध्याची जोखीम**: **${riskCategory}** (${temp}, ${humidity}).
• **सलग उन्हातील ड्युटी मर्यादा**: WBGT ३०°से पेक्षा जास्त असताना दुपारच्या वेळेत (१२:०० ते १६:००) उन्हात सलग उभं राहण्याची वेळ जास्तीत जास्त **४५ मिनिटे** ठेवावी.
• **अनिवार्य सावली विश्रांती**: प्रत्येक ४५ मिनिटांच्या ड्युटीनंतर किमान **१५ मिनिटे सावलीत विश्रांती** व पाणी पिणे बंधनकारक करा.
• **जोडीने आलटून-पालटून रोटेशन**: भर उन्हातील मुख्य जंक्शन आणि सावलीतील पेरिफेरल बूथ यांच्यात अंमलदारांची आलटून-पालटून ड्युटी लावा.
• **राखीव अंमलदार व्यवस्था**: विश्रांतीच्या काळात वाहतूक खोळंबू नये म्हणून राखीव अंमलदार तैनात ठेवा.`;
    }

    if (isHindi) {
      return `🔄 **${locName} के लिए स्मार्ट ड्यूटी रोटेशन नीति (WBGT > 30°C)**:

• **वर्तमान हीट स्तर**: **${riskCategory}** (${temp}, ${humidity})।
• **अधिकतम लगातार ड्यूटी**: दोपहर के पीक समय (12:00 - 16:00) में धूप में अधिकतम **45-60 मिनट** की लगातार ड्यूटी सीमित करें।
• **अनिवार्य छायादार विश्राम**: प्रत्येक शिफ्ट अंतराल के बाद कम से कम **15 मिनट** की छायादार विश्रांति अनिवार्य रूप से दें।
• **रोटेशन नीति**: मुख्य ट्रैफिक आइलैंड और साइड-कंट्रोल बूथ के बीच कर्मियों को रोटेट करें।
• **स्वास्थ्य संवेदनशीलता**: उच्च रक्तचाप, मधुमेह या पूर्व में लू लगे कर्मियों को केवल सावली वाले स्थान पर तैनात करें।`;
    }

    return `🔄 **Smart Duty Rotation Strategy for ${locName} (WBGT > 30°C)**:

• **Current Heat Category**: **${riskCategory}** (${temp}, ${humidity}).
• **Continuous Exposure Cap**: Limit continuous unshaded roadway duty to a maximum of **45–60 minutes** during peak solar apex (12:00 – 16:00).
• **Mandatory Shaded Recovery**: Enforce a minimum **15-minute cool-down rest** under canopy shade or misting post between road deployments.
• **Staggered Pair Rotations**: Rotate officers between high radiant heat posts (e.g. center junction island) and shaded peripheral posts.
• **Vulnerable Personnel**: Officers with prior heat exhaustion or cardiovascular conditions must be limited to shaded posts or maximum 30m stints.`;
  }

  // Cooling & Shelter Infrastructure
  if (
    queryLower.includes('cooling') ||
    queryLower.includes('shelter') ||
    queryLower.includes('facility') ||
    queryLower.includes('misting') ||
    queryLower.includes('umbrella') ||
    queryLower.includes('shade') ||
    queryLower.includes('छाया') ||
    queryLower.includes('छतरी') ||
    queryLower.includes('सावली') ||
    queryLower.includes('थंडावा')
  ) {
    if (isMarathi) {
      return `🏗️ **${locName} साठी थंडावा देणाऱ्या सुविधा व शेड प्राधान्यक्रम**:

तापमान ${temp} असताना संरक्षणासाठी:
१. **अतिनील किरण संरक्षक कॅनोपी/छत्री**: ट्रॅफिक बेटावर तात्काळ किमान ८५% यूव्ही ब्लॉक असणारी कॅनोपी बसवा.
२. **हाय-प्रेशर मिस्टिंग फॅन्स**: हवेतील तापमान ४°ते ७°से ने कमी करण्यासाठी मिस्टिंग फॅन्स सुरू करा.
३. **थंड पाण्याचे डिस्पेंसर**: ड्युटी पॉईंटच्या ३० मीटर अंतरावर थर्मल इन्सुलेटेड थंड पाणी आणि ओआरएस जार ठेवा.
४. **कूलिंग जॅकेट्स**: दुपारच्या सत्रातील अंमलदारांना फेज-चेंज कूलिंग व्हेस्ट पुरवा.`;
    }

    if (isHindi) {
      return `🏗️ **${locName} के लिए कूलिंग इंफ्रास्ट्रक्चर प्राथमिकताएं**:

कर्मियों की सुरक्षा (${temp}) हेतु:
1. **छायादार कैनोपी / छाता**: मुख्य चौराहे पर कम से कम 85% यूवी ब्लॉक वाली रिफ्लेक्टिव कैनोपी स्थापित करें।
2. **मिस्टिंग स्प्रे यूनिट**: चौराहे पर हवा का तापमान 4°C-7°C घटाने के लिए मिस्टिंग सिस्टम लगाएं।
3. **ठंडा ओआरएस पानी**: ड्यूटी लाइन से 30 मीटर के भीतर 20 लीटर का थर्मल इंसुलेटेड वाटर डिस्पेंसर रखें।
4. **कूलिंग जैकेट**: दोपहर 13:00-15:00 की शिफ्ट में तैनात अधिकारियों को कूलिंग वेस्ट उपलब्ध कराएं।`;
    }

    return `🏗️ **Cooling Infrastructure Prioritization for ${locName}**:

To protect duty personnel exposed to ${temp}:
1. **Primary Shade Barrier**: Install cantilevered high-density UV reflective umbrellas or modular roadside canopies with at least 85% UV block over the main traffic island.
2. **Evaporative Misting**: Deploy solar-assisted low-pressure misting nozzles at the control island, capable of reducing microclimate air temperature by 4°C–7°C.
3. **Chilled Water Dispensers**: Maintain insulated 20-liter chilled electrolyte dispensers within 30 meters of the duty line.
4. **Cooling Vests**: Issue phase-change material (PCM) cooling vests for officers scheduled during the 13:00–15:00 solar apex.`;
  }

  // General default overview
  if (isMarathi) {
    return `☀️ **${locName} साठी हीटशील्ड सुरक्षा अहवाल**:

• **पर्यावरण स्थिती**: तापमान ${temp} | आर्द्रता ${humidity} | जोखीम पातळी: **${riskCategory}**
• **डांबरी रस्त्यावरील उष्णता**: डांबरी पृष्ठभागामुळे हवेचे तापमान सामान्य हवामान केंद्रापेक्षा ३° ते ६°से जास्त असते.
• **मुख्य शिफारसी**:
  १. दर १५ ते २० मिनिटांनी पाणी प्या.
  २. ४५ ते ६० मिनिटांपेक्षा जास्त सलग उन्हात थांबू नका.
  ३. ट्रॅफिक बेटावर सावलीची व्यवस्था करा.
  ४. थकवा, चक्कर किंवा डोकेदुखी जाणवल्यास त्वरित सावलीत विश्रांती घ्या.`;
  }

  if (isHindi) {
    return `☀️ **${locName} के लिए हीटशील्ड सुरक्षा रिपोर्ट**:

• **पर्यावरणीय प्रोफाइल**: तापमान ${temp} | आर्द्रता ${humidity} | जोखिम स्तर: **${riskCategory}**
• **डामर रोड हीट प्रभाव**: डामर की सतह के कारण हवा का तापमान सामान्य मौसम केंद्र से 3°C से 6°C अधिक गर्म रहता है।
• **प्राथमिक सुझाव**:
  1. हर 15 से 20 मिनट में नियमित पानी व ओआरएस का सेवन करें।
  2. 45-60 मिनट से अधिक लगातार सीधी धूप में ड्यूटी न करें।
  3. ट्रैफिक आइलैंड पर छायादार छतरी या कैनोपी लगाएं।
  4. चक्कर, अत्यधिक पसीना या उल्टी की शिकायत पर तुरंत आराम दें।`;
  }

  return `☀️ **HeatShield Operational Assessment for ${locName}**:

• **Environmental Profile**: ${temp} | ${humidity} | Risk Level: **${riskCategory}**
• **Traffic Island Heat Island Effect**: Ambient air temperature directly above asphalt surfaces is typically 3°C to 6°C hotter than surrounding standard weather stations due to re-radiation.
• **Primary Recommendations**:
  1. Enforce strict 15-minute hydration cycles (200–250ml chilled fluid).
  2. Implement staggered officer rotations to prevent continuous direct-sun exposure beyond 60 minutes.
  3. Ensure physical shade or portable umbrellas are deployed over the junction directing post.
  4. Watch for early heat exhaustion signs: dizziness, excessive fatigue, profuse sweating followed by goosebumps, or headache.`;
}

// API: Live Weather via Open-Meteo
app.get('/api/weather/live', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,direct_normal_irradiance&forecast_days=2&timezone=auto`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!resp.ok) {
      throw new Error(`Open-Meteo responded with status ${resp.status}`);
    }

    const data = await resp.json();
    const current = data.current || {};

    const hourly = data.hourly || {};
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const humids = hourly.relative_humidity_2m || [];
    const feels = hourly.apparent_temperature || [];

    const forecastPoints = [];
    for (let i = 0; i < Math.min(times.length, 24); i++) {
      forecastPoints.push({
        time: times[i],
        temperature: temps[i],
        humidity: humids[i],
        apparentTemperature: feels[i]
      });
    }

    return res.json({
      status: 'live_verified',
      provider: 'Open-Meteo Global NWP',
      latitude: lat,
      longitude: lon,
      elevation: data.elevation,
      timezone: data.timezone,
      observationTime: current.time || new Date().toISOString(),
      temperature: current.temperature_2m,
      relativeHumidity: current.relative_humidity_2m,
      apparentTemperature: current.apparent_temperature,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      isDay: current.is_day,
      hourly: forecastPoints,
      isSimulated: false
    });
  } catch (err: any) {
    console.warn(`Live weather fetch failed for [${lat}, ${lon}]:`, err.message);
    const simulatedTemp = 36.5;
    const simulatedHumidity = 48;
    return res.json({
      status: 'simulated_fallback',
      provider: 'HeatShield Offline Microclimate Model (Fallback)',
      latitude: lat,
      longitude: lon,
      observationTime: new Date().toISOString(),
      temperature: simulatedTemp,
      relativeHumidity: simulatedHumidity,
      apparentTemperature: 41.2,
      windSpeed: 8.5,
      weatherCode: 0,
      isDay: 1,
      hourly: [],
      isSimulated: true,
      reason: `Live provider unreachable (${err.message}). Showing labelled fallback estimation.`
    });
  }
});

// API: Geocode Search via Nominatim OpenStreetMap
app.get('/api/geocode/search', async (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=6`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'HeatShield-AI-Climate-Safety/1.0 (contact: support@heatshield.internal)'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!resp.ok) {
      throw new Error(`Nominatim responded with ${resp.status}`);
    }

    const raw = await resp.json();
    const results = raw.map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      country: item.address?.country || '',
      state: item.address?.state || item.address?.region || '',
      district: item.address?.state_district || item.address?.county || '',
      city: item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || '',
      verified: true
    }));

    return res.json({ results });
  } catch (err: any) {
    console.warn('Geocode search failed:', err.message);
    return res.json({
      results: [],
      error: 'Geocoding provider temporarily unavailable. Please enter coordinates manually.'
    });
  }
});

// Initialize server (dev with Vite or prod static)
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HeatShield AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
