import { IconFlowHub, type IconFlowMetrics } from '@/src/components/IconFlowHub';
import {
  CUSTOMER_METRIC_FLOWS,
  CUSTOMER_PRIMARY_FLOWS,
  type CustomerFlowId,
} from '@/src/constants/customerFlows';
import { useCustomerFlowLauncher } from '@/src/hooks/useCustomerFlowLauncher';

export type CustomerFlowMetrics = IconFlowMetrics;

type Props = {
  bioSlug?: string | null;
  cardId?: string | null;
  metrics?: CustomerFlowMetrics;
  title?: string;
  subtitle?: string;
  textColor?: string;
  mutedColor?: string;
};

export function CustomerFlowHub({
  bioSlug,
  cardId,
  metrics = {},
  title = 'Your NFC workspace',
  subtitle = 'My card · preview · track · connections',
  textColor,
  mutedColor,
}: Props) {
  const { launch } = useCustomerFlowLauncher({ bioSlug, cardId });

  return (
    <IconFlowHub
      title={title}
      subtitle={subtitle}
      primaryFlows={CUSTOMER_PRIMARY_FLOWS}
      metricFlows={CUSTOMER_METRIC_FLOWS}
      metrics={metrics}
      onLaunch={(id: CustomerFlowId) => void launch(id)}
      textColor={textColor}
      mutedColor={mutedColor}
    />
  );
}
