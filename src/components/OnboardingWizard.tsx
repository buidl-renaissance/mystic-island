import { useState } from "react";
import styled, { keyframes } from "styled-components";
import InitializeMythos from "./InitializeMythos";

// Color Palette
const colors = {
  emeraldSpirit: "#2D5A3D",
  deepForest: "#0A1410",
  sunlitGold: "#E8A855",
  skyDawn: "#4A7A9A",
  lotusPink: "#B85A8F",
  sunsetOrange: "#C76A2A",
  orchidPurple: "#5A3F8F",
  jungleCyan: "#4A9A7A",
  textPrimary: "#F5F5F5",
  textSecondary: "#D0D0D0",
  textMuted: "#A0A0A0",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const WizardContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Step = styled.div<{ active: boolean; completed: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: ${(props) => {
    if (props.completed) return colors.jungleCyan;
    if (props.active) return colors.sunlitGold;
    return "rgba(160, 160, 160, 0.2)";
  }};
  color: ${(props) => {
    if (props.completed || props.active) return colors.textPrimary;
    return colors.textMuted;
  }};
  border: 2px solid
    ${(props) => {
      if (props.completed) return colors.jungleCyan;
      if (props.active) return colors.sunlitGold;
      return "rgba(160, 160, 160, 0.3)";
    }};
  transition: all 0.3s ease;
`;

const StepContent = styled.div`
  min-height: 400px;
`;

const WelcomeSection = styled.div`
  text-align: center;
  padding: 2rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1rem;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${colors.textSecondary};
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 2rem;
`;

const SuccessSection = styled.div`
  text-align: center;
  padding: 2rem;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }
`;

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mythosInitialized, setMythosInitialized] = useState(false);

  const steps = [
    {
      title: "Welcome",
      component: (
        <WelcomeSection>
          <Title>Welcome to Mystic Island</Title>
          <Description>
            You're about to initialize the realm's mythos—the foundational story, theme, and lore
            that will shape all locations and experiences on this island. This is a one-time setup
            that defines the essence of your realm.
          </Description>
          <Button onClick={() => setCurrentStep(1)}>Begin Initialization</Button>
        </WelcomeSection>
      ),
    },
    {
      title: "Initialize Mythos",
      component: (
        <InitializeMythos
          onSuccess={() => {
            setMythosInitialized(true);
            setCurrentStep(2);
          }}
        />
      ),
    },
    {
      title: "Complete",
      component: (
        <SuccessSection>
          <SuccessIcon>✨</SuccessIcon>
          <Title>Mythos Initialized!</Title>
          <Description>
            The realm's mythos has been successfully initialized. You can now create locations and
            begin building your island's story.
          </Description>
          {onComplete && <Button onClick={onComplete}>Continue to Dashboard</Button>}
        </SuccessSection>
      ),
    },
  ];

  return (
    <WizardContainer>
      <StepIndicator>
        {steps.map((step, index) => (
          <Step
            key={index}
            active={index === currentStep}
            completed={index < currentStep || (index === 2 && mythosInitialized)}
          >
            {index < currentStep || (index === 2 && mythosInitialized) ? "✓" : index + 1}
          </Step>
        ))}
      </StepIndicator>

      <StepContent>{steps[currentStep].component}</StepContent>
    </WizardContainer>
  );
}

