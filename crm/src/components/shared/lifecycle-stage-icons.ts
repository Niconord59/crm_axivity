import {
  UserPlus,
  Target,
  Phone,
  TrendingUp,
  CheckCircle,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { LifecycleStage } from "@/types";

// Centralized icon mapping for lifecycle stages
// Used by LifecycleStageBadge and LifecycleStageSelect
export const LIFECYCLE_STAGE_ICONS: Record<LifecycleStage, LucideIcon> = {
  Lead: UserPlus,
  MQL: Target,
  SQL: Phone,
  Opportunity: TrendingUp,
  Customer: CheckCircle,
  Evangelist: Star,
  Churned: XCircle,
};
