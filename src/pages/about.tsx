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

const Section = styled.section`
  width: 100%;
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const HeroSection = styled(Section)`
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
  margin: 0 auto 48px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-cinzel), var(--font-cormorant), serif;
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 24px;
  color: ${colors.sunlitGold};
  text-shadow: 0 2px 15px rgba(242, 182, 99, 0.2);
  position: relative;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 20px;
  line-height: 1.8;
  color: ${colors.textSecondary};
  max-width: 800px;
  margin: 0 auto 48px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Card = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.25) 100%);
  border: 2px solid ${colors.emeraldSpirit};
  border-radius: 24px;
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      45deg,
      ${colors.emeraldSpirit},
      ${colors.jungleCyan},
      ${colors.emeraldSpirit}
    );
    border-radius: 24px;
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(63, 127, 82, 0.3), 0 0 20px rgba(101, 201, 166, 0.2);
    border-color: ${colors.jungleCyan};

    &::before {
      opacity: 0.3;
    }
  }
`;

const CardTitle = styled.h3`
  font-family: var(--font-cormorant), serif;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const CardText = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${colors.textSecondary};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 24px 0;
`;

const FeatureItem = styled.li`
  font-size: 18px;
  line-height: 2;
  color: ${colors.textSecondary};
  margin-bottom: 12px;
  padding-left: 32px;
  position: relative;

  &::before {
    content: "🌿";
    position: absolute;
    left: 0;
    font-size: 20px;
    filter: drop-shadow(0 0 4px ${colors.jungleCyan});
  }
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
  margin-top: 48px;
`;

const Step = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const StepNumber = styled.div<{ delay?: number }>`
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${colors.emeraldSpirit} 0%, ${colors.sunlitGold} 100%);
  color: ${colors.deepForest};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(242, 182, 99, 0.4);
  animation: ${gentleFloat} 4s ease-in-out infinite;
  animation-delay: ${(props) => (props.delay || 0) * 0.5}s;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-family: var(--font-cormorant), serif;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const StepText = styled.p`
  font-size: 18px;
  line-height: 1.8;
  color: ${colors.textSecondary};
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
  margin: 32px 0;
`;

const IconItem = styled.div`
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.2) 100%);
  border: 1px solid ${colors.emeraldSpirit};
  border-radius: 20px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, ${colors.orchidPurple} 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
    opacity: 0.3;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: ${colors.orchidPurple};
    box-shadow: 0 8px 30px rgba(108, 75, 175, 0.3);

    &::before {
      width: 200px;
      height: 200px;
    }
  }
`;

const Icon = styled.div<{ delay?: number }>`
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 8px ${colors.sunlitGold});
  animation: ${gentleFloat} 5s ease-in-out infinite;
  animation-delay: ${(props) => (props.delay || 0) * 0.3}s;
`;

const IconLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.sunlitGold};
`;

const TechGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const TechItem = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.2) 100%);
  border: 1px solid ${colors.emeraldSpirit};
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: ${colors.jungleCyan};
    box-shadow: 0 8px 25px rgba(101, 201, 166, 0.2);
  }
`;

const TechName = styled.div`
  font-family: var(--font-cormorant), serif;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.sunlitGold};
  margin-bottom: 8px;
`;

const TechDesc = styled.div`
  font-size: 14px;
  color: ${colors.textMuted};
  line-height: 1.6;
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.2) 0%, rgba(10, 20, 16, 0.3) 100%);
  border-left: 4px solid ${colors.sunlitGold};
  padding: 32px;
  border-radius: 16px;
  margin: 32px 0;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, ${colors.orchidPurple} 0%, transparent 70%);
    opacity: 0.1;
    animation: ${drift} 15s ease-in-out infinite;
  }
`;

const HighlightText = styled.p`
  font-size: 18px;
  line-height: 1.8;
  color: ${colors.textPrimary};
  margin: 0;
  position: relative;
  z-index: 1;

  strong {
    color: ${colors.sunlitGold};
    font-weight: 600;
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
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 48px;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const Footer = styled.footer`
  background: ${colors.deepForest};
  color: #ffffff;
  padding: 60px 24px 40px;
  margin-top: 80px;
  position: relative;
  border-top: 2px solid ${colors.emeraldSpirit};
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${colors.emeraldSpirit},
      ${colors.jungleCyan},
      ${colors.emeraldSpirit},
      transparent
    );
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
`;

const FooterSection = styled.div``;

const FooterTitle = styled.h4`
  font-family: var(--font-cormorant), serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const FooterLink = styled.a`
  display: block;
  color: ${colors.textMuted};
  text-decoration: none;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  position: relative;
  padding-left: 0;

  &::before {
    content: "→";
    position: absolute;
    left: -20px;
    opacity: 0;
    transition: all 0.3s ease;
    color: ${colors.jungleCyan};
  }

  &:hover {
    color: ${colors.sunlitGold};
    padding-left: 20px;

    &::before {
      opacity: 1;
      left: 0;
    }
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 40px;
  border-top: 1px solid rgba(45, 90, 61, 0.4);
  text-align: center;
  color: ${colors.textMuted};
`;

export default function About() {
  return (
    <>
      <Head>
        <title>About Mystic Island – Features & Platform Details</title>
        <meta
          name="description"
          content="Learn about Mystic Island's features, Totem system, cross-realm connections, economy, and technology stack."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageContainer className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} ${merriweather.variable}`}>
        {/* Hero Section */}
        <HeroSection>
          <ParticleContainer>
            {Array.from({ length: 15 }).map((_, i) => (
              <Particle
                key={i}
                delay={i * 0.5}
                duration={10 + Math.random() * 10}
                x={Math.random() * 100}
                y={Math.random() * 100}
              />
            ))}
          </ParticleContainer>
          <HeroTitle>About Mystic Island</HeroTitle>
          <HeroSubtitle>
            A collaborative world where communities build, grow, and connect through shared creation.
          </HeroSubtitle>
        </HeroSection>

        {/* 1. The Why */}
        <Section id="why">
          <SectionTitle>The Why</SectionTitle>
          <SectionSubtitle>
            Communities need better tools to grow together.
          </SectionSubtitle>
          <ContentGrid>
            <Card>
              <CardTitle>Online spaces are fragmented</CardTitle>
              <CardText>
                Communities struggle to find cohesive platforms that bring
                everyone together.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Artists struggle for attention</CardTitle>
              <CardText>
                Creative work gets lost in the noise without proper community
                support.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Builders are isolated</CardTitle>
              <CardText>
                Developers and creators work alone without collaborative
                frameworks.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Organizers can't coordinate</CardTitle>
              <CardText>
                Community leaders lack tools to effectively manage and grow
                their groups.
              </CardText>
            </Card>
            <Card>
              <CardTitle>New creators have nowhere to start</CardTitle>
              <CardText>
                Beginners face barriers to entry without clear pathways to
                contribute.
              </CardText>
            </Card>
          </ContentGrid>
          <HighlightBox>
            <HighlightText>
              <strong>Mystic Island</strong> turns communities into living
              worlds—where collaboration, creativity, and reputation take form.
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* 2. How It Works */}
        <Section id="how">
          <SectionTitle>How It Works</SectionTitle>
          <StepContainer>
            <Step>
              <StepNumber delay={0}>1</StepNumber>
              <StepContent>
                <StepTitle>Start an Island</StepTitle>
                <StepText>
                  Every community gets its own Island (Saga chainlet). Define
                  your culture, your lore, your quests, your roles.
                </StepText>
              </StepContent>
            </Step>
            <Step>
              <StepNumber delay={1}>2</StepNumber>
              <StepContent>
                <StepTitle>Build Your Totem</StepTitle>
                <StepText>
                  Members contribute art, code, quests, events, and Seeds to
                  grow your Totem Power. Your Totem becomes the symbol of your
                  collective identity.
                </StepText>
              </StepContent>
            </Step>
            <Step>
              <StepNumber delay={2}>3</StepNumber>
              <StepContent>
                <StepTitle>Connect With Other Islands</StepTitle>
                <StepText>
                  Stake your Totem Power to open bridges, share resources, run
                  cross-realm quests, and grow together.
                </StepText>
              </StepContent>
            </Step>
          </StepContainer>
        </Section>

        {/* 3. The Totem System */}
        <Section id="totem">
          <SectionTitle>🗿 Your Totem Is Your Community's Heart</SectionTitle>
          <SectionSubtitle>
            Every contribution from your members feeds your Totem and increases
            its Power.
          </SectionSubtitle>
          <IconGrid>
            <IconItem>
              <Icon delay={0}>🎨</Icon>
              <IconLabel>Art</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={1}>🛠️</Icon>
              <IconLabel>Builds</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={2}>📜</Icon>
              <IconLabel>Lore</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={3}>🎧</Icon>
              <IconLabel>Events</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={4}>🤝</Icon>
              <IconLabel>Collaboration</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={5}>🌱</Icon>
              <IconLabel>Seeds</IconLabel>
            </IconItem>
          </IconGrid>
          <HighlightBox>
            <HighlightText>
              <strong>Totem Power</strong> = your community's collective
              strength.
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* 4. Totem Power */}
        <Section id="power">
          <SectionTitle>⚡ Stake Power. Not the Totem.</SectionTitle>
          <SectionSubtitle>
            Your Totem is sacred and permanent. But the Power inside it can be
            staked to:
          </SectionSubtitle>
          <FeatureList>
            <FeatureItem>Open cross-realm bridges</FeatureItem>
            <FeatureItem>Unlock shared quests</FeatureItem>
            <FeatureItem>Launch multi-community festivals</FeatureItem>
            <FeatureItem>Craft inter-realm artifacts</FeatureItem>
            <FeatureItem>Form alliances</FeatureItem>
            <FeatureItem>Participate in global governance</FeatureItem>
          </FeatureList>
          <HighlightBox>
            <HighlightText>
              <strong>If something goes wrong? Only power is slashed.</strong>
              <br />
              Your Totem stays safe. Your culture endures.
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* 5. The World Layer */}
        <Section id="world">
          <SectionTitle>🌉 Islands Are Connected by Bridges You Build Together</SectionTitle>
          <SectionSubtitle>
            Communities choose who they connect with. Every bridge unlocks new
            experiences:
          </SectionSubtitle>
          <ContentGrid>
            <Card>
              <CardTitle>Cross-realm quests</CardTitle>
              <CardText>
                Embark on adventures that span multiple Islands, requiring
                collaboration between communities.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Shared events</CardTitle>
              <CardText>
                Host festivals, ceremonies, and gatherings that bring Islands
                together.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Collaborative exhibitions</CardTitle>
              <CardText>
                Showcase art, builds, and creations across connected realms.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Inter-realm markets</CardTitle>
              <CardText>
                Trade resources, artifacts, and unique items between Islands.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Joint lore arcs</CardTitle>
              <CardText>
                Create interconnected stories that weave through multiple
                communities.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Co-created relics</CardTitle>
              <CardText>
                Build powerful artifacts together that represent shared
                achievements.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Resource exchange</CardTitle>
              <CardText>
                Share and trade resources to help each Island grow and thrive.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Diplomatic alliances</CardTitle>
              <CardText>
                Form strategic partnerships and alliances between communities.
              </CardText>
            </Card>
          </ContentGrid>
          <HighlightBox>
            <HighlightText>
              Your Island is sovereign—but never alone.
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* 6. The Economy Layer */}
        <Section id="economy">
          <SectionTitle>🎁 A Living Digital Economy</SectionTitle>
          <ContentGrid>
            <Card>
              <CardTitle>Realm-Native Assets</CardTitle>
              <FeatureList>
                <FeatureItem>Reputation</FeatureItem>
                <FeatureItem>Badges</FeatureItem>
                <FeatureItem>Roles</FeatureItem>
                <FeatureItem>Community relics</FeatureItem>
                <FeatureItem>Totem tiers</FeatureItem>
              </FeatureList>
              <CardText>
                These are tied to your Island and reflect your culture. They
                represent your standing within your community and cannot be
                transferred between realms.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Portable Global Assets</CardTitle>
              <FeatureList>
                <FeatureItem>Relics</FeatureItem>
                <FeatureItem>Tools</FeatureItem>
                <FeatureItem>Wearables</FeatureItem>
                <FeatureItem>Seeds</FeatureItem>
                <FeatureItem>Mounts/pets</FeatureItem>
                <FeatureItem>Marketplace items</FeatureItem>
              </FeatureList>
              <CardText>
                These travel between Islands through Hyperlane teleportation.
                They represent your journey across the world and can be used
                anywhere.
              </CardText>
            </Card>
          </ContentGrid>
        </Section>

        {/* 7. What Makes It Special */}
        <Section id="special">
          <SectionTitle>✨ What Makes It Special</SectionTitle>
          <ContentGrid>
            <Card>
              <CardTitle>For Creators</CardTitle>
              <FeatureList>
                <FeatureItem>
                  Your work becomes part of the world's lore
                </FeatureItem>
                <FeatureItem>
                  Your art unlocks quests and generates reputation
                </FeatureItem>
                <FeatureItem>
                  Your community promotes you organically through the Totem
                </FeatureItem>
              </FeatureList>
            </Card>
            <Card>
              <CardTitle>For Builders</CardTitle>
              <FeatureList>
                <FeatureItem>Build chainlet-native mini-worlds</FeatureItem>
                <FeatureItem>
                  Script quests, NPCs, items, rituals
                </FeatureItem>
                <FeatureItem>
                  Extend the world with your own mechanics
                </FeatureItem>
              </FeatureList>
            </Card>
            <Card>
              <CardTitle>For Communities</CardTitle>
              <FeatureList>
                <FeatureItem>Grow reputation together</FeatureItem>
                <FeatureItem>Create rituals and events</FeatureItem>
                <FeatureItem>
                  Connect with other Islands on your own terms
                </FeatureItem>
              </FeatureList>
            </Card>
            <Card>
              <CardTitle>For Ecosystem Partners</CardTitle>
              <FeatureList>
                <FeatureItem>Chainlet-per-Island architecture</FeatureItem>
                <FeatureItem>Cross-realm messaging</FeatureItem>
                <FeatureItem>Composable lore + assets</FeatureItem>
                <FeatureItem>Real-world activation at IRL events</FeatureItem>
              </FeatureList>
            </Card>
          </ContentGrid>
        </Section>

        {/* 8. How It's Built */}
        <Section id="tech">
          <SectionTitle>🔧 Under the hood</SectionTitle>
          <SectionSubtitle>
            Mystic Island is built on cutting-edge blockchain technology
            designed for sovereignty, scalability, and interoperability.
          </SectionSubtitle>
          <TechGrid>
            <TechItem>
              <TechName>Saga Chainlets</TechName>
              <TechDesc>
                Every Island is its own sovereign chain, giving communities
                complete control over their realm's rules and governance.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>Hyperlane</TechName>
              <TechDesc>
                Cross-realm teleportation for assets and explorers, enabling
                seamless travel between Islands.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>Symbiotic Relay</TechName>
              <TechDesc>
                Totem Power staking + slashing mechanism that ensures security
                while protecting your Totem itself.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>ENS</TechName>
              <TechDesc>
                Community member identities tied to Ethereum Name Service for
                portable, recognizable identities.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>XMTP</TechName>
              <TechDesc>
                NPC messages, diplomatic envoys, quest updates, and
                cross-realm communication.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>Oasis</TechName>
              <TechDesc>
                Private rituals + sealed lore for communities that want
                exclusive, encrypted content.
              </TechDesc>
            </TechItem>
            <TechItem>
              <TechName>Hardhat</TechName>
              <TechDesc>
                Developer tools for islands, making it easy to build custom
                mechanics and integrations.
              </TechDesc>
            </TechItem>
          </TechGrid>
        </Section>

        {/* CTA Section */}
        <Section>
          <SectionTitle>🌱 Ready to Build Your Realm?</SectionTitle>
          <SectionSubtitle>
            Create your Island, gather your community, and begin building your
            Totem.
          </SectionSubtitle>
          <ButtonGroup>
            <PrimaryButton href="/deploy-wallet">Start Your Island</PrimaryButton>
            <PrimaryButton
              href="https://discord.gg/mysticisland"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Mystic Island Discord
            </PrimaryButton>
          </ButtonGroup>
        </Section>

        {/* Footer */}
        <Footer id="footer">
          <FooterContent>
            <FooterSection>
              <FooterTitle>Resources</FooterTitle>
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About</FooterLink>
              <FooterLink
                href="https://github.com/mystic-island"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </FooterLink>
              <FooterLink href="#design-kit">Design Kit</FooterLink>
              <FooterLink href="#press-kit">Press Kit</FooterLink>
            </FooterSection>
            <FooterSection>
              <FooterTitle>Community</FooterTitle>
              <FooterLink
                href="https://discord.gg/mysticisland"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </FooterLink>
              <FooterLink
                href="https://twitter.com/mysticisland"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </FooterLink>
            </FooterSection>
            <FooterSection>
              <FooterTitle>Contact</FooterTitle>
              <FooterLink href="#contact">Contact Us</FooterLink>
              <FooterLink href="#team">Team</FooterLink>
            </FooterSection>
          </FooterContent>
          <FooterBottom>
            <p>© 2024 Mystic Island. All rights reserved.</p>
          </FooterBottom>
        </Footer>
      </PageContainer>
    </>
  );
}

