export type Student = {
  id: number;
  name: string;
  gender?: 'Masculino' | 'Feminino';
  status?: 'em dia' | 'em atraso';
  age?: number;                 // calculado pelo service
  start_date?: string | null;
  end_date?: string | null;
  contact?: string | number | null;
  date_of_birth?: Date | null;  // convertido do backend
  surname?: string;
};
