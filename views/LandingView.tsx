
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/Card';
import { LockIcon, ShieldCheckIcon, ShareIcon, KeyRoundIcon, TwitterIcon, GithubIcon, LinkedinIcon, QuoteIcon, PlusIcon, UserPlusIcon, FilePlusIcon, GlobeIcon } from '../constants';
import { useI18n } from '../i18n';

const LandingView: React.FC = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    
    const handleNavigateToAuth = () => {
        navigate('/auth');
    };
    
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center">
                    <LockIcon className="w-7 h-7 text-accent" />
                    <h1 className="text-xl font-bold ml-2">VaultCloud</h1>
                </div>
                 <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                    <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
                </nav>
                <Button onClick={handleNavigateToAuth}>{t('signIn')}</Button>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 sm:px-6 text-center pt-20 pb-20 sm:pt-28 sm:pb-24">
                 <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                    {t('digitalFortress')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                    {t('heroSubtitle')}
                </p>
                <div className="flex justify-center items-center gap-4">
                    <Button onClick={handleNavigateToAuth} size="lg">Create Your Free Account</Button>
                </div>
                 <div className="relative mt-16">
                    <div className="absolute top-1/2 left-1/2 w-[80%] h-[60%] -translate-x-1/2 -translate-y-1/2 bg-accent/30 rounded-full blur-3xl -z-10"></div>
                     <Card className="max-w-3xl mx-auto bg-card/50 backdrop-blur-sm ring-1 ring-inset ring-border/50 shadow-2xl shadow-primary/10">
                        <CardHeader className="flex flex-row items-center gap-2 p-3 border-b bg-muted/50">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-red-500/80 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500/80 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500/80 rounded-full"></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex gap-6">
                            <div className="w-1/4 space-y-2">
                                <div className="w-full h-8 rounded bg-primary/80"></div>
                                <div className="w-full h-8 rounded bg-muted"></div>
                                <div className="w-full h-8 rounded bg-muted"></div>
                                <div className="w-full h-8 rounded bg-muted"></div>
                            </div>
                            <div className="w-3/4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-1/3 h-6 rounded bg-muted"></div>
                                    <div className="w-1/4 h-8 rounded bg-primary/80"></div>
                                </div>
                                <div className="w-full h-10 rounded bg-muted"></div>
                                <div className="w-full h-10 rounded bg-muted"></div>
                                <div className="w-3/4 h-10 rounded bg-muted"></div>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-20 bg-card">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold tracking-tight">{t('whyVaultCloud')}</h2>
                        <p className="text-muted-foreground mt-2">{t('whySubtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <FeatureCard 
                            icon={<ShieldCheckIcon className="w-8 h-8 text-accent" />}
                            title={t('feature1Title')} 
                            description={t('feature1Desc')} 
                        />
                        <FeatureCard 
                            icon={<ShareIcon className="w-8 h-8 text-accent" />}
                            title="Secure Syncing" 
                            description={t('feature2Desc')} 
                        />
                        <FeatureCard 
                            icon={<KeyRoundIcon className="w-8 h-8 text-accent" />}
                            title="Advanced Security" 
                            description="Protect your account with 2FA and support for hardware security keys (FIDO2)." 
                        />
                    </div>
                </div>
            </section>
            
            {/* How It Works Section */}
            <section id="how-it-works" className="py-20">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Get Started in Three Simple Steps</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <StepCard 
                            icon={<UserPlusIcon className="w-8 h-8 text-accent"/>}
                            step="1. Create Account"
                            description="Sign up for your free account in seconds. No credit card required."
                        />
                         <StepCard 
                            icon={<FilePlusIcon className="w-8 h-8 text-accent"/>}
                            step="2. Add Your Data"
                            description="Easily add your passwords, secure notes, and other sensitive information to your encrypted vault."
                        />
                         <StepCard 
                            icon={<GlobeIcon className="w-8 h-8 text-accent"/>}
                            step="3. Access Anywhere"
                            description="Securely access your data from any device, anytime. Your digital life, synchronized and safe."
                        />
                    </div>
                </div>
            </section>

             {/* Testimonials */}
            <section className="py-20 bg-card">
                 <div className="container mx-auto px-4 sm:px-6">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">What Our Users Say</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <TestimonialCard 
                            quote="VaultCloud has been a game-changer for our team's security. It's simple, intuitive, and incredibly secure."
                            author="Jane Doe"
                            title="CTO, TechCorp"
                        />
                         <TestimonialCard 
                            quote="I finally have peace of mind knowing all my passwords and private notes are in one safe place, accessible everywhere."
                            author="John Smith"
                            title="Freelance Developer"
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20">
                <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        <Accordion title="Is VaultCloud secure?">
                            Yes. Security is our top priority. We use industry-leading, zero-knowledge encryption (AES-256), meaning only you can access your data. Your master password is your private key, and we never see it, store it, or transmit it.
                        </Accordion>
                        <Accordion title="Can I use VaultCloud on multiple devices?">
                            Absolutely. You can sync your vault across all your devices seamlessly, including desktops, laptops, tablets, and mobile phones.
                        </Accordion>
                        <Accordion title="What is a Master Password?">
                            Your Master Password is the one password you need to remember. It's used to encrypt and decrypt your vault data on your device. Make it strong and memorable, as it's the key to your digital fortress.
                        </Accordion>
                         <Accordion title="Can I import my data from another password manager?">
                            Yes, you can easily import your data from most other password managers using a CSV or JSON file. Our settings panel provides a simple import tool to get you started.
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight">Ready to Secure Your Digital Life?</h2>
                    <p className="text-muted-foreground mt-2 mb-6">Create your free VaultCloud account today and experience true peace of mind. It's free forever.</p>
                    <Button onClick={handleNavigateToAuth} size="lg">Get Started - It's Free</Button>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="border-t">
                <div className="container mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center mb-2">
                            <LockIcon className="w-7 h-7 text-accent" />
                            <h1 className="text-xl font-bold ml-2">VaultCloud</h1>
                        </div>
                         <p className="text-muted-foreground text-sm">Your Digital Fortress</p>
                    </div>
                    <div className="text-sm">
                        <h4 className="font-semibold mb-2">Product</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#features" className="hover:text-foreground">Features</a></li>
                            <li><a href="#" className="hover:text-foreground">Security</a></li>
                            <li><a href="#" className="hover:text-foreground">Download</a></li>
                        </ul>
                    </div>
                     <div className="text-sm">
                        <h4 className="font-semibold mb-2">Company</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">About Us</a></li>
                            <li><a href="#" className="hover:text-foreground">Blog</a></li>
                            <li><a href="#" className="hover:text-foreground">Careers</a></li>
                        </ul>
                    </div>
                     <div className="text-sm">
                        <h4 className="font-semibold mb-2">Legal</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                 <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground border-t">
                    <p>{t('footer', { year: new Date().getFullYear() })}</p>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <a href="#" aria-label="Twitter"><TwitterIcon className="w-5 h-5 hover:text-foreground"/></a>
                        <a href="#" aria-label="GitHub"><GithubIcon className="w-5 h-5 hover:text-foreground"/></a>
                        <a href="#" aria-label="LinkedIn"><LinkedinIcon className="w-5 h-5 hover:text-foreground"/></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
    <div className="text-center p-6 bg-background rounded-lg">
        <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-accent/10 mb-4 mx-auto">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const StepCard: React.FC<{icon: React.ReactNode, step: string, description: string}> = ({ icon, step, description }) => (
    <div className="text-center p-6">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mb-4 mx-auto ring-8 ring-accent/5">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{step}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const TestimonialCard: React.FC<{ quote: string, author: string, title: string }> = ({ quote, author, title }) => (
    <Card className="p-6">
        <QuoteIcon className="w-8 h-8 text-muted-foreground/50 mb-4"/>
        <p className="text-muted-foreground mb-4">"{quote}"</p>
        <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    </Card>
);

const Accordion: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border rounded-md">
            <button className="flex justify-between items-center w-full p-4 font-medium text-left" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <PlusIcon className={`w-5 h-5 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-45' : ''}`}/>
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-muted-foreground">
                    {children}
                </div>
            )}
        </div>
    );
};

export default LandingView;
