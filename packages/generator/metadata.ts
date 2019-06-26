export interface TypeSymbol {
  name: string;
  path: string;
}

export interface Argument {
  type: TypeSymbol;
  name: string;
}

export interface Method {
  name: string;
  sideEffect: boolean;
  arguments: Argument[];
  returnType: TypeSymbol | null;
}

export interface Service {
  name: string;
  methods: Method[];
}
