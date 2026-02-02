type UserType = 'business' | 'individual' | null;

interface SignUpFeaturesPanelProps {
  userType: UserType;
}

export default function SignUpFeaturesPanel({ userType }: SignUpFeaturesPanelProps) {
  const businessFeatures = [
    {
      title: 'Tax research',
      description: 'Get instant, expert-level answers to complex business tax questions and regulations.',
    },
    {
      title: 'Document management & analysis',
      description: 'Securely upload and analyze business tax documents and get personalized insights.',
    },
    {
      title: 'Tax writer',
      description: 'Draft professional tax communications and IRS responses, and address internal questions and external inquiries from customers, vendors, and other stakeholders.',
    },
    {
      title: 'Stay updated on tax laws',
      description: 'RPCTaxGPT consistently keeps you updated on new regulations and legislative changes.',
    },
    {
      title: 'Tax calculations & reporting',
      description: 'Save time and reduce errors by automating complex tax calculations and reporting across various tax types.',
    },
  ];

  const individualFeatures = [
    {
      title: 'Tax question answers',
      description: 'Get accurate answers to all your personal tax questions instantly and effortlessly.',
    },
    {
      title: 'Deduction discovery',
      description: 'Find every eligible tax deduction based on your specific personal tax situation.',
    },
    {
      title: 'Audit risk minimization',
      description: 'Stay compliant with real-time tax law updates to minimize your audit risk.',
    },
    {
      title: 'Tax form guidance',
      description: 'Navigate essential tax forms like T1, T4, T5, and Schedule C with step-by-step assistance for accuracy and ease.',
    },
    {
      title: 'Tax calculations',
      description: 'Accurately calculate your taxes without any complex guesswork.',
    },
  ];


  const getTitle = () => {
    if (userType === 'business') {
      return 'AI tax assistant for businesses';
    } else if (userType === 'individual') {
      return 'Get help with personal taxes';
    } else {
      // Default title when no selection
      return 'AI tax assistant for everyone';
    }
  };

  const getFeatures = () => {
    if (userType === 'business') {
      return businessFeatures;
    } else if (userType === 'individual') {
      return individualFeatures;
    } else {
      // Show business features by default
      return businessFeatures;
    }
  };

  const features = getFeatures();
  const title = getTitle();

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 flex-col justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
        
        <div className="space-y-6">
          {features.map((feature, index) => (
            <div key={index} className="text-white">
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <p className="text-gray-400 mt-8 text-sm">and more than 30 other features...</p>
      </div>
    </div>
  );
}
