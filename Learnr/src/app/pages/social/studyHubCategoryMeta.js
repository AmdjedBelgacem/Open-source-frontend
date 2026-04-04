import {
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  ChartLine,
  FlaskConical,
  Gavel,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Leaf,
  Microscope,
  Pickaxe,
  Scale,
  Shield,
  Sigma,
  Sparkles,
  Stethoscope,
  Target,
  Timer,
  Atom,
  Workflow,
  Code2,
} from 'lucide-react';

export const THREAD_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'math', label: 'Math' },
  { value: 'science', label: 'Science' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'language', label: 'Language' },
  { value: 'literature', label: 'Literature' },
  { value: 'programming', label: 'Programming' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'ai-ml', label: 'AI & ML' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'law', label: 'Law' },
  { value: 'economics', label: 'Economics' },
  { value: 'business', label: 'Business' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'exam-strategy', label: 'Exam Strategy' },
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'career', label: 'Career' },
];

const CATEGORY_META = {
  general: {
    icon: BookOpen,
    colors: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.42)', text: '#cbd5e1' },
  },
  math: {
    icon: Sigma,
    colors: { bg: 'rgba(34, 211, 238, 0.14)', border: 'rgba(34, 211, 238, 0.4)', text: '#67e8f9' },
  },
  science: {
    icon: Microscope,
    colors: { bg: 'rgba(45, 212, 191, 0.14)', border: 'rgba(45, 212, 191, 0.4)', text: '#5eead4' },
  },
  physics: {
    icon: Atom,
    colors: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.42)', text: '#93c5fd' },
  },
  chemistry: {
    icon: FlaskConical,
    colors: { bg: 'rgba(14, 165, 233, 0.14)', border: 'rgba(14, 165, 233, 0.4)', text: '#7dd3fc' },
  },
  biology: {
    icon: Leaf,
    colors: { bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.4)', text: '#86efac' },
  },
  language: {
    icon: Languages,
    colors: { bg: 'rgba(249, 115, 22, 0.14)', border: 'rgba(249, 115, 22, 0.42)', text: '#fdba74' },
  },
  literature: {
    icon: BookOpen,
    colors: { bg: 'rgba(217, 119, 6, 0.14)', border: 'rgba(217, 119, 6, 0.42)', text: '#fcd34d' },
  },
  programming: {
    icon: Code2,
    colors: { bg: 'rgba(139, 92, 246, 0.14)', border: 'rgba(139, 92, 246, 0.42)', text: '#c4b5fd' },
  },
  'data-science': {
    icon: ChartLine,
    colors: { bg: 'rgba(6, 182, 212, 0.14)', border: 'rgba(6, 182, 212, 0.42)', text: '#67e8f9' },
  },
  'ai-ml': {
    icon: Sparkles,
    colors: { bg: 'rgba(168, 85, 247, 0.14)', border: 'rgba(168, 85, 247, 0.42)', text: '#d8b4fe' },
  },
  cybersecurity: {
    icon: Shield,
    colors: { bg: 'rgba(244, 63, 94, 0.14)', border: 'rgba(244, 63, 94, 0.42)', text: '#fda4af' },
  },
  engineering: {
    icon: Workflow,
    colors: { bg: 'rgba(45, 212, 191, 0.14)', border: 'rgba(45, 212, 191, 0.42)', text: '#99f6e4' },
  },
  medicine: {
    icon: Stethoscope,
    colors: { bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.42)', text: '#6ee7b7' },
  },
  law: {
    icon: Scale,
    colors: { bg: 'rgba(234, 179, 8, 0.14)', border: 'rgba(234, 179, 8, 0.42)', text: '#fde047' },
  },
  economics: {
    icon: Landmark,
    colors: { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.42)', text: '#fcd34d' },
  },
  business: {
    icon: Building2,
    colors: { bg: 'rgba(59, 130, 246, 0.14)', border: 'rgba(59, 130, 246, 0.42)', text: '#bfdbfe' },
  },
  history: {
    icon: Pickaxe,
    colors: { bg: 'rgba(180, 83, 9, 0.15)', border: 'rgba(180, 83, 9, 0.42)', text: '#fdba74' },
  },
  geography: {
    icon: Globe2,
    colors: { bg: 'rgba(14, 165, 233, 0.14)', border: 'rgba(14, 165, 233, 0.42)', text: '#bae6fd' },
  },
  philosophy: {
    icon: Brain,
    colors: { bg: 'rgba(217, 70, 239, 0.14)', border: 'rgba(217, 70, 239, 0.42)', text: '#f0abfc' },
  },
  psychology: {
    icon: Brain,
    colors: { bg: 'rgba(236, 72, 153, 0.14)', border: 'rgba(236, 72, 153, 0.42)', text: '#f9a8d4' },
  },
  'exam-strategy': {
    icon: Timer,
    colors: { bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.42)', text: '#fca5a5' },
  },
  'exam-prep': {
    icon: GraduationCap,
    colors: { bg: 'rgba(124, 58, 237, 0.14)', border: 'rgba(124, 58, 237, 0.42)', text: '#c4b5fd' },
  },
  productivity: {
    icon: Target,
    colors: { bg: 'rgba(34, 197, 94, 0.14)', border: 'rgba(34, 197, 94, 0.42)', text: '#bbf7d0' },
  },
  career: {
    icon: Briefcase,
    colors: { bg: 'rgba(99, 102, 241, 0.14)', border: 'rgba(99, 102, 241, 0.42)', text: '#c7d2fe' },
  },
};

const FALLBACK = {
  icon: BookOpen,
  colors: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.42)', text: '#cbd5e1' },
};

export function getStudyHubCategoryMeta(categoryValue) {
  const normalized = String(categoryValue || 'general').trim().toLowerCase();
  const info = CATEGORY_META[normalized] || FALLBACK;
  const category = THREAD_CATEGORIES.find((item) => item.value === normalized) || THREAD_CATEGORIES[0];

  return {
    value: category.value,
    label: category.label,
    icon: info.icon,
    colors: info.colors,
  };
}
