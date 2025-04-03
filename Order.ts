export class Order {
  id: number;
  type: string;
  amount: number;
  flag: boolean;
  status: string;
  priority: string;

  constructor(id: number, type: string, amount: number, flag: boolean) {
      this.id = id;
      this.type = type;
      this.amount = amount;
      this.flag = flag;
      this.status = 'new';
      this.priority = 'low';
  }
}
