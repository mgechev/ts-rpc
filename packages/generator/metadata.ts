export interface TypeSymbol {
  name: string;
  path: string;
  params?: [];
}

export interface Argument {
  type: TypeSymbol;
  name: string;
}

export interface Method {
  name: string;
  sideEffect: boolean;
  arguments: Argument[];
  returnType: TypeSymbol;
}

export interface Service {
  name: string;
  methods: Method[];
}
