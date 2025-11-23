import styled from "styled-components";
import { useUserStats } from "@/hooks/useUserStats";

const colors = {
  sunlitGold: "#E8A855",
  textSecondary: "#D0D0D0",
};

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(232, 168, 85, 0.15);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const BalanceLabel = styled.span`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
  font-weight: 600;
`;

const BalanceValue = styled.span`
  font-size: 1.2rem;
  color: ${colors.sunlitGold};
  font-weight: 700;
  font-family: monospace;
`;

const RefreshButton = styled.button`
  background: rgba(232, 168, 85, 0.2);
  border: 1px solid rgba(232, 168, 85, 0.4);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  color: ${colors.sunlitGold};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background: rgba(232, 168, 85, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface MagicBalanceProps {
  showLabel?: boolean;
  compact?: boolean;
}

export default function MagicBalance({ showLabel = true, compact = false }: MagicBalanceProps) {
  const { magicBalance, isLoading, refetch } = useUserStats();

  return (
    <BalanceContainer style={compact ? { padding: "0.5rem 1rem" } : undefined}>
      {showLabel && <BalanceLabel>Magic:</BalanceLabel>}
      <BalanceValue style={compact ? { fontSize: "1rem" } : undefined}>
        {isLoading ? "..." : magicBalance ? parseFloat(magicBalance).toFixed(2) : "0.00"}
      </BalanceValue>
      <RefreshButton onClick={() => refetch()} disabled={isLoading} title="Refresh balance">
        ↻
      </RefreshButton>
    </BalanceContainer>
  );
}

