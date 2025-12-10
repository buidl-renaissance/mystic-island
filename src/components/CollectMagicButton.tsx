import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { parseEther } from "viem";

const colors = {
  sunlitGold: "#E8A855",
  sunsetOrange: "#C76A2A",
  jungleCyan: "#4A9A7A",
  textPrimary: "#F5F5F5",
  textSecondary: "#D0D0D0",
};

const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232, 168, 85, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(232, 168, 85, 0); }
`;

const Button = styled.button<{ disabled: boolean; isCollecting: boolean }>`
  padding: 1rem 2rem;
  background: ${props => props.disabled 
    ? 'rgba(100, 100, 100, 0.3)' 
    : 'linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%)'};
  border: 2px solid ${props => props.disabled 
    ? 'rgba(232, 168, 85, 0.2)' 
    : 'rgba(232, 168, 85, 0.5)'};
  border-radius: 12px;
  color: ${colors.textPrimary};
  font-weight: 700;
  font-size: 1.1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${props => props.isCollecting ? pulse : 'none'} 1.5s ease-in-out infinite;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const RewardAmount = styled.div`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
  margin-top: 0.5rem;
  font-weight: 600;
`;

const CooldownTimer = styled.div`
  font-size: 0.85rem;
  color: ${colors.textSecondary};
  margin-top: 0.5rem;
  font-style: italic;
`;

const SuccessMessage = styled.div`
  background: rgba(74, 154, 122, 0.2);
  border: 1px solid ${colors.jungleCyan};
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 1rem;
  color: ${colors.jungleCyan};
  font-weight: 600;
  animation: ${sparkle} 0.5s ease-in-out;
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 1rem;
  color: ${colors.sunsetOrange};
  font-weight: 600;
`;

interface CollectMagicButtonProps {
  locationId: number;
  difficulty: number;
  onSuccess?: () => void;
}

// Calculate reward based on difficulty
function calculateReward(difficulty: number): string {
  const rewards = {
    0: "1", // None
    1: "3", // Easy: 1-5 MAGIC, using 3 as average
    2: "7", // Normal: 5-10 MAGIC, using 7 as average
    3: "15", // Hard: 10-20 MAGIC, using 15 as average
    4: "35", // Mythic: 20-50 MAGIC, using 35 as average
  };
  return rewards[difficulty as keyof typeof rewards] || "1";
}

// Get cooldown key for localStorage
function getCooldownKey(locationId: number, address: string): string {
  return `location_visit_${locationId}_${address}`;
}

// Check if location can be visited (24 hour cooldown)
function canVisit(locationId: number, address: string | null): { canVisit: boolean; timeRemaining: number } {
  if (!address) return { canVisit: false, timeRemaining: 0 };
  
  const key = getCooldownKey(locationId, address);
  const lastVisit = localStorage.getItem(key);
  
  if (!lastVisit) return { canVisit: true, timeRemaining: 0 };
  
  const lastVisitTime = parseInt(lastVisit, 10);
  const now = Date.now();
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
  const timeRemaining = cooldownMs - (now - lastVisitTime);
  
  if (timeRemaining > 0) {
    return { canVisit: false, timeRemaining };
  }
  
  return { canVisit: true, timeRemaining: 0 };
}

// Format time remaining
function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function CollectMagicButton({ locationId, difficulty, onSuccess }: CollectMagicButtonProps) {
  const { isSignedIn, evmAddress } = useUnifiedAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [visitState, setVisitState] = useState<{ canVisit: boolean; timeRemaining: number }>({ canVisit: false, timeRemaining: 0 });

  const rewardAmount = calculateReward(difficulty);

  useEffect(() => {
    if (evmAddress) {
      const state = canVisit(locationId, evmAddress);
      setVisitState(state);
    }
  }, [locationId, evmAddress]);

  // Update cooldown timer
  useEffect(() => {
    if (!visitState.canVisit && visitState.timeRemaining > 0) {
      const interval = setInterval(() => {
        const state = canVisit(locationId, evmAddress || "");
        setVisitState(state);
        if (state.canVisit) {
          clearInterval(interval);
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [visitState, locationId, evmAddress]);

  const handleCollect = async () => {
    if (!isSignedIn || !evmAddress) {
      setError("Please sign in to collect Magic");
      return;
    }

    setIsCollecting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/visit-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          address: evmAddress,
          rewardAmount: parseEther(rewardAmount).toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to collect Magic");
      }

      // Store visit timestamp
      const key = getCooldownKey(locationId, evmAddress);
      localStorage.setItem(key, Date.now().toString());

      setSuccess(true);
      setVisitState({ canVisit: false, timeRemaining: 24 * 60 * 60 * 1000 });

      if (onSuccess) {
        onSuccess();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error collecting Magic:", err);
      setError(err instanceof Error ? err.message : "Failed to collect Magic");
    } finally {
      setIsCollecting(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  const disabled = !visitState.canVisit || isCollecting;

  return (
    <div>
      <Button
        onClick={handleCollect}
        disabled={disabled}
        isCollecting={isCollecting}
      >
        {isCollecting ? "Collecting Magic..." : "✨ Collect Magic"}
      </Button>
      <RewardAmount>Reward: {rewardAmount} MAGIC</RewardAmount>
      {!visitState.canVisit && visitState.timeRemaining > 0 && (
        <CooldownTimer>
          Available in: {formatTimeRemaining(visitState.timeRemaining)}
        </CooldownTimer>
      )}
      {success && (
        <SuccessMessage>
          ✨ Successfully collected {rewardAmount} MAGIC!
        </SuccessMessage>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}

