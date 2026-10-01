import { LOTTO_TYPES } from './constants';
import { sortDigits } from './formatters';

export const getTypeRate = (type, rates) => rates[type] ?? LOTTO_TYPES.find(([label]) => label === type)?.[2] ?? 0;
export const getDigitsForType = (type) => LOTTO_TYPES.find(([label]) => label === type)?.[1] ?? 2;

export const generatePermutations = (value) => {
  const text = String(value || '');
  if (!text || text.length < 2) return [text];
  const set = new Set();
  const walk = (chars, prefix) => {
    if (chars.length === 0) {
      set.add(prefix);
      return;
    }
    for (let i = 0; i < chars.length; i += 1) {
      const next = chars.slice(0, i).concat(chars.slice(i + 1));
      walk(next, prefix + chars[i]);
    }
  };
  walk(text.split(''), '');
  return [...set];
};

export const normalizeDraw = (draw) => {
  if (!draw) return null;
  return {
    first: String(draw.first || '').replace(/\D/g, ''),
    second: Array.isArray(draw.second) ? draw.second.map((n) => String(n || '').replace(/\D/g, '')) : [],
    third: Array.isArray(draw.third) ? draw.third.map((n) => String(n || '').replace(/\D/g, '')) : [],
    fourth: Array.isArray(draw.fourth) ? draw.fourth.map((n) => String(n || '').replace(/\D/g, '')) : [],
    fifth: Array.isArray(draw.fifth) ? draw.fifth.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last2: Array.isArray(draw.last2) ? draw.last2.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last3f: Array.isArray(draw.last3f) ? draw.last3f.map((n) => String(n || '').replace(/\D/g, '')) : [],
    last3b: Array.isArray(draw.last3b) ? draw.last3b.map((n) => String(n || '').replace(/\D/g, '')) : [],
    near1: Array.isArray(draw.near1) ? draw.near1.map((n) => String(n || '').replace(/\D/g, '')) : [],
    source: draw.source || 'manual',
  };
};

export const calculatePayout = (item, draw, rates) => {
  if (!draw) return 0;
  const first = String(draw.first || '').replace(/\D/g, '');
  const last2 = (draw.last2 || [])[0] || '';
  const last3Set = [...(draw.last3f || []), ...(draw.last3b || [])];
  const t3 = first.slice(-3);
  const t2 = first.slice(-2);

  let won = false;
  switch (item.type) {
    case '3 ตัวบน':
      won = item.number === t3;
      break;
    case '3 ตัวโต๊ด':
      won = sortDigits(item.number) === sortDigits(t3);
      break;
    case '3 ตัวล่าง':
      won = last3Set.includes(item.number);
      break;
    case '2 ตัวบน':
      won = item.number === t2;
      break;
    case '2 ตัวล่าง':
      won = item.number === last2;
      break;
    case 'วิ่งบน':
      won = first.includes(item.number);
      break;
    case 'วิ่งล่าง':
      won = (last2 || '').includes(item.number);
      break;
    default:
      won = false;
  }

  return won ? Number(item.amount || 0) * (getTypeRate(item.type, rates) || 0) : 0;
};

export const generateLuckyNumber = () => {
  const digits = Math.floor(Math.random() * 4) + 2; // 2-5 digits
  let num = '';
  for (let i = 0; i < digits; i += 1) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
};
