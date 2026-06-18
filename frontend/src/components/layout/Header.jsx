import { users } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-[#f8fafc] border-b border-black/5">
      <div>
        {title}
      </div>
      <div>
        {/* Header actions would go here */}
      </div>
    </header>
  );
};

export default Header;