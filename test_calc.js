import { calculateBaZi } from './src/utils/bazi.js';
import { analyzeNameUnified } from './src/utils/nameAnalysis.js';

const mockData = {
  name: "赵强",
  gender: "male",
  birthDate: "1969-07-31",
  birthTime: "12:00",
  isOverseas: false,
  chinaAddress: "山东河阳",
  worldCountry: "",
  birthEnv: "hospitalModern",
  surname: "赵",
  givenName: "强",
  surnameStrokes: "",
  givenNameStrokes: "",
  isEnglish: false,
  lang: "zh-CN"
};

try {
  console.log("Calculating BaZi...");
  const result = calculateBaZi(mockData);
  console.log("BaZi Result:", result.dayMasterElement);

  console.log("Analyzing Name...");
  const naming = analyzeNameUnified({
    surname: mockData.surname,
    givenName: mockData.givenName,
    surnameStrokes: parseInt(mockData.surnameStrokes) || 0,
    givenNameStrokes: parseInt(mockData.givenNameStrokes) || 0,
    dayMasterElement: result.dayMasterElement,
    language: mockData.isEnglish ? 'en' : 'zh'
  });
  console.log("Naming Result Score:", naming.totalScore);
  
  console.log("All successful!");
} catch (e) {
  console.error("Error occurred:", e);
}
