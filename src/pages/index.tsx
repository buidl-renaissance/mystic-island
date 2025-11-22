import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter, Merriweather_Sans } from "next/font/google";

// Fonts
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather_Sans({
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

// Color Palette - Darker for better contrast
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

// Animations
const drift = keyframes`
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -30px); }
  66% { transform: translate(-20px, 20px); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const gentleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const bloom = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Base Components
const PageContainer = styled.div`
  background: 
    linear-gradient(180deg, rgba(26, 47, 26, 0.4) 0%, rgba(45, 74, 45, 0.3) 25%, rgba(30, 58, 30, 0.35) 50%, rgba(15, 42, 15, 0.5) 75%, rgba(10, 26, 10, 0.6) 100%),
    url('/images/luma.png') center center / cover no-repeat fixed;
  color: #ffffff;
  font-family: var(--font-inter), var(--font-merriweather), sans-serif;
  overflow-x: hidden;
  position: relative;

  @media (max-width: 768px) {
    background: 
      linear-gradient(180deg, rgba(26, 47, 26, 0.4) 0%, rgba(45, 74, 45, 0.3) 25%, rgba(30, 58, 30, 0.35) 50%, rgba(15, 42, 15, 0.5) 75%, rgba(10, 26, 10, 0.6) 100%),
      url('/images/luma-tall-2.png') center right / cover no-repeat fixed;
  }

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at 30% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(100, 255, 218, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(255, 182, 193, 0.03) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.65);
    pointer-events: none;
    z-index: 1;
  }
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`;

const Particle = styled.div<{ delay: number; duration: number; x: number; y: number }>`
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(144, 238, 144, 0.7);
  border-radius: 50%;
  animation: ${drift} ${props => props.duration}s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  box-shadow: 0 0 15px rgba(144, 238, 144, 0.9), 0 0 30px rgba(255, 215, 0, 0.3);
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem;
  position: relative;
  z-index: 2;
  opacity: 0;
  animation: ${fadeIn} 1.5s ease-in-out forwards;
  animation-delay: 1s;

  @media (min-width: 768px) {
    justify-content: center;
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-cinzel), var(--font-cormorant), serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: ${colors.sunlitGold};
  letter-spacing: -1px;
  text-shadow: 0 2px 20px rgba(242, 182, 99, 0.3);
  position: relative;
  z-index: 2;
  animation: ${gentleFloat} 6s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 40px;
    letter-spacing: -0.5px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 22px;
  line-height: 1.8;
  color: ${colors.textSecondary};
  max-width: 800px;
  margin-bottom: 48px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }
`;

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: linear-gradient(135deg, ${colors.emeraldSpirit} 0%, ${colors.sunlitGold} 100%);
  color: ${colors.deepForest};
  border-radius: 40px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.4s ease;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(45, 90, 61, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover {
    background: linear-gradient(135deg, ${colors.sunsetOrange} 0%, ${colors.sunlitGold} 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(233, 138, 58, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    animation: ${bloom} 0.6s ease;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(63, 127, 82, 0.3);
  }

  &:active::before {
    width: 300px;
    height: 300px;
    animation: ${ripple} 0.6s ease-out;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: transparent;
  color: ${colors.sunlitGold};
  border: 2px solid ${colors.sunlitGold};
  border-radius: 40px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: ${colors.sunlitGold};
    transition: left 0.4s ease;
    z-index: -1;
  }

  &:hover {
    color: ${colors.deepForest};
    border-color: ${colors.sunsetOrange};
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(242, 182, 99, 0.3);

    &::before {
      left: 0;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// Generate particles outside component to avoid linter issues
const generateParticles = () => {
  return Array.from({ length: 15 }).map((_, i) => ({
    key: i,
    delay: i * 0.5,
    duration: 10 + Math.random() * 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));
};

const particles = generateParticles();

export default function Home() {

  return (
    <>
      <Head>
        <title>Mystic Island – Build Your World. Grow Your Community.</title>
        <meta
          name="description"
          content="Mystic Island is a collaborative creation engine where communities form their own realms, build powerful Totems together, and connect with other Islands through quests, relics, and cross-realm alliances."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageContainer className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} ${merriweather.variable}`}>
        {/* Hero Section */}
        <HeroSection>
          <ParticleContainer>
            {particles.map((particle) => (
              <Particle
                key={particle.key}
                delay={particle.delay}
                duration={particle.duration}
                x={particle.x}
                y={particle.y}
              />
            ))}
          </ParticleContainer>
          <HeroTitle>
            Build. Connect. Grow.
          </HeroTitle>
          <HeroSubtitle>
            Communities form their own realms, build Totems together, and connect through shared experiences.
          </HeroSubtitle>
          <ButtonGroup>
            <PrimaryButton href="/deploy-wallet">Begin Your Journey</PrimaryButton>
            <SecondaryButton href="/about">
              Learn More
            </SecondaryButton>
          </ButtonGroup>
        </HeroSection>

      </PageContainer>
    </>
  );
}
