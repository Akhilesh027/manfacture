import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  buttonLabel: string;
  href: string;
  icon?: LucideIcon;
}

const StatCard = ({ title, value, buttonLabel, href, icon: Icon }: StatCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className="w-6 h-6 text-muted-foreground" />}
        <h3 className="text-xl font-semibold m-0">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-primary my-3">{value}</p>
      <Button onClick={() => navigate(href)} className="mt-2">
        {buttonLabel}
      </Button>
    </div>
  );
};

export default StatCard;
